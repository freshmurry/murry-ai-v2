// ================================================================
// MurryAI - Main Cloudflare Worker Entry Point
// ================================================================

import type { Env } from './types';
import { apiError } from './types';
import {
  handleProjects,
  handleDocuments,
  uploadDocument,
  handleQA,
  handleCompliance,
  handleConversations,
  handleBrain,
  handleWorkflows,
} from './api/handlers';
import { ConversationDurableObject } from './durable-objects/ConversationDO';
import { DocumentIngestionWorkflow } from './workflows/DocumentIngestionWorkflow';

// Re-export Durable Objects and Workflows for Wrangler binding
export { ConversationDurableObject, DocumentIngestionWorkflow };

// ──────────────────────────────────────────
// CORS Headers
// ──────────────────────────────────────────

function corsHeaders(origin?: string): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Project-ID',
    'Access-Control-Max-Age': '86400',
  };
}

function withCORS(response: Response, origin?: string): Response {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
  return new Response(response.body, { status: response.status, headers });
}

// ──────────────────────────────────────────
// Main Router
// ──────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const origin = request.headers.get('Origin') ?? undefined;

    // ── CORS preflight ──
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    try {
      let response: Response;

      // ── WebSocket upgrade for chat ──
      if (pathname.startsWith('/ws/') && request.headers.get('Upgrade') === 'websocket') {
        response = await handleWebSocket(request, env, pathname);
      }

      // ── API Routes ──
      else if (pathname.startsWith('/api/')) {
        response = await routeAPI(request, env, pathname);
      }

      // ── Health check ──
      else if (pathname === '/health') {
        response = new Response(JSON.stringify({
          status: 'ok',
          app: env.APP_NAME,
          ts: new Date().toISOString(),
        }), { headers: { 'Content-Type': 'application/json' } });
      }

      // ── Static assets (the React SPA) ──
      else {
        response = await serveStaticAssets(request, env, pathname);
      }

      return withCORS(response, origin);
    } catch (err) {
      console.error('Unhandled error:', err);
      return withCORS(
        apiError(`Internal server error: ${err instanceof Error ? err.message : String(err)}`, 500),
        origin
      );
    }
  },
};

// ──────────────────────────────────────────
// API Router
// ──────────────────────────────────────────

async function routeAPI(request: Request, env: Env, pathname: string): Promise<Response> {
  // /api/projects[/:id]
  if (pathname.match(/^\/api\/projects(\/.*)?$/)) {
    return handleProjects(request, env);
  }

  // /api/documents[/:id[/content]]
  if (pathname.match(/^\/api\/documents(\/.*)?$/)) {
    return handleDocuments(request, env);
  }

  // /api/upload (multipart form upload shortcut)
  if (pathname === '/api/upload' && request.method === 'POST') {
    return uploadDocument(request, env);
  }

  // /api/qa[/:id]
  if (pathname.match(/^\/api\/qa(\/.*)?$/)) {
    return handleQA(request, env);
  }

  // /api/compliance[/:id]
  if (pathname.match(/^\/api\/compliance(\/.*)?$/)) {
    return handleCompliance(request, env);
  }

  // /api/conversations[/:id]
  if (pathname.match(/^\/api\/conversations(\/.*)?$/)) {
    return handleConversations(request, env);
  }

  // /api/brain[/:id]
  if (pathname.match(/^\/api\/brain(\/.*)?$/)) {
    return handleBrain(request, env);
  }

  // /api/workflows
  if (pathname.startsWith('/api/workflows')) {
    return handleWorkflows(request, env);
  }

  // /api/search
  if (pathname === '/api/search' && request.method === 'POST') {
    return handleSearch(request, env);
  }

  // /api/tasks[/:id/approve]
  if (pathname.match(/^\/api\/tasks(\/.*)?$/) && request.method === 'POST') {
    return handleTaskApproval(request, env, pathname);
  }

  return apiError(`API endpoint not found: ${pathname}`, 404);
}

// ──────────────────────────────────────────
// WebSocket Handler → Durable Object
// ──────────────────────────────────────────

async function handleWebSocket(request: Request, env: Env, pathname: string): Promise<Response> {
  // /ws/:conversation_id
  const match = pathname.match(/^\/ws\/(.+)$/);
  if (!match) return apiError('Invalid WebSocket path', 400);

  const conversationId = match[1];

  // Route to the Durable Object for this conversation
  const id = env.CONVERSATION_DO.idFromName(conversationId);
  const stub = env.CONVERSATION_DO.get(id);

  // Forward to Durable Object
  return stub.fetch(new Request(`https://internal/ws`, {
    method: 'GET',
    headers: request.headers,
  }));
}

// ──────────────────────────────────────────
// Search Endpoint
// ──────────────────────────────────────────

async function handleSearch(request: Request, env: Env): Promise<Response> {
  const { executeRAG } = await import('./lib/rag');
  const body = await request.json() as { query: string; project_id?: string; top_k?: number };

  if (!body.query) return apiError('query is required', 400);

  const ctx = await executeRAG(body.query, env, {
    project_id: body.project_id,
    top_k: body.top_k ?? 8,
    rerank: true,
  });

  return new Response(JSON.stringify({
    success: true,
    data: {
      citations: ctx.citations,
      total_chunks: ctx.total_chunks,
      tokens_used: ctx.tokens_used,
    },
  }), { headers: { 'Content-Type': 'application/json' } });
}

// ──────────────────────────────────────────
// Task Approval
// ──────────────────────────────────────────

async function handleTaskApproval(request: Request, env: Env, pathname: string): Promise<Response> {
  // /api/tasks/:id/approve
  const match = pathname.match(/^\/api\/tasks\/([^/]+)\/approve$/);
  if (!match) return apiError('Invalid task approval path', 400);

  const taskId = match[1];
  const body = await request.json() as { approved: boolean; reason?: string; conversation_id: string };

  // Get the conversation ID from the task
  const task = await env.DB.prepare('SELECT conversation_id FROM agent_tasks WHERE id = ?')
    .bind(taskId)
    .first<{ conversation_id: string }>();

  if (!task) return apiError('Task not found', 404);

  const convId = body.conversation_id ?? task.conversation_id;
  const id = env.CONVERSATION_DO.idFromName(convId);
  const stub = env.CONVERSATION_DO.get(id);

  return stub.fetch(new Request('https://internal/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_id: taskId, approved: body.approved, reason: body.reason }),
  }));
}

// ──────────────────────────────────────────
// Static Asset Serving (SPA fallback)
// ──────────────────────────────────────────

async function serveStaticAssets(request: Request, env: Env, pathname: string): Promise<Response> {
  try {
    // Try exact path first
    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) return assetResponse;

    // SPA fallback — serve index.html for all non-API routes
    const indexRequest = new Request(new URL('/index.html', request.url).toString(), request);
    return env.ASSETS.fetch(indexRequest);
  } catch {
    return new Response('Not Found', { status: 404 });
  }
}
