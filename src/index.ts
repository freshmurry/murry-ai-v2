// ================================================================
// MurryAIv2 - Main Cloudflare Worker Entry Point
// ================================================================

import type { Env } from './types';
import { apiError, apiJson, generateId } from './types';
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

// Re-export imported classes so Wrangler can find them
export { ConversationDurableObject, DocumentIngestionWorkflow };

// ──────────────────────────────────────────
// ProjectDurableObject
// Lightweight per-project state store
// ──────────────────────────────────────────
export class ProjectDurableObject {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/state') {
      const stored = await this.state.storage.get<Record<string, unknown>>('ps') ?? {};
      return Response.json(stored);
    }

    if (request.method === 'PUT' && url.pathname === '/state') {
      const body = await request.json() as Record<string, unknown>;
      const current = await this.state.storage.get<Record<string, unknown>>('ps') ?? {};
      const merged = { ...current, ...body, updated_at: new Date().toISOString() };
      await this.state.storage.put('ps', merged);
      return Response.json(merged);
    }

    if (request.method === 'DELETE') {
      await this.state.storage.deleteAll();
      return Response.json({ deleted: true });
    }

    return new Response('Not Found', { status: 404 });
  }
}

// ──────────────────────────────────────────
// ProposalAnalysisWorkflow
// Background multi-document analysis pipeline
// ──────────────────────────────────────────
export class ProposalAnalysisWorkflow {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async run(
    event: { payload: { project_id: string; document_ids: string[]; analysis_types: string[] } },
    step: { do: <T>(name: string, fn: () => Promise<T>) => Promise<T> }
  ): Promise<unknown> {
    const { project_id, document_ids, analysis_types } = event.payload;
    const results: Record<string, unknown> = {};

    for (const t of analysis_types) {
      results[t] = await step.do(`analyse-${t}`, async () => {
        const id = `${t}_${Date.now()}`;
        await this.env.DB.prepare(
          "INSERT INTO workflow_runs (id, project_id, workflow_type, status, progress) VALUES (?,?,?,'running',0)"
        ).bind(id, project_id, `proposal_${t}`).run();
        return { run_id: id, status: 'queued', doc_count: document_ids.length };
      });
    }

    return { success: true, project_id, results };
  }
}

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

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    try {
      let response: Response;

      // WebSocket upgrade for chat
      if (pathname.startsWith('/ws/') && request.headers.get('Upgrade') === 'websocket') {
        response = await handleWebSocket(request, env, pathname);
      }
      // API Routes
      else if (pathname.startsWith('/api/')) {
        response = await routeAPI(request, env, pathname);
      }
      // Health check
      else if (pathname === '/health') {
        response = new Response(
          JSON.stringify({ status: 'ok', app: env.APP_NAME, ts: new Date().toISOString() }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
      // Static assets (React SPA)
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
  if (pathname.match(/^\/api\/projects(\/.*)?$/))
    return handleProjects(request, env);

  if (pathname.match(/^\/api\/documents(\/.*)?$/))
    return handleDocuments(request, env);

  if (pathname === '/api/upload' && request.method === 'POST')
    return uploadDocument(request, env);

  if (pathname.match(/^\/api\/qa(\/.*)?$/))
    return handleQA(request, env);

  if (pathname.match(/^\/api\/compliance(\/.*)?$/))
    return handleCompliance(request, env);

  if (pathname.match(/^\/api\/conversations(\/.*)?$/))
    return handleConversations(request, env);

  if (pathname.match(/^\/api\/brain(\/.*)?$/))
    return handleBrain(request, env);

  if (pathname === '/api/chat' && request.method === 'POST')
    return handleChat(request, env);

  if (pathname.startsWith('/api/workflows'))
    return handleWorkflows(request, env);

  if (pathname === '/api/search' && request.method === 'POST')
    return handleSearch(request, env);

  if (pathname.match(/^\/api\/tasks(\/.*)?$/) && request.method === 'POST')
    return handleTaskApproval(request, env, pathname);

  return apiError(`API endpoint not found: ${pathname}`, 404);
}

// ──────────────────────────────────────────
// WebSocket → Durable Object
// ──────────────────────────────────────────

async function handleWebSocket(request: Request, env: Env, pathname: string): Promise<Response> {
  const match = pathname.match(/^\/ws\/(.+)$/);
  if (!match) return apiError('Invalid WebSocket path', 400);

  const conversationId = match[1];
  const id = env.CONVERSATION_DO.idFromName(conversationId);
  const stub = env.CONVERSATION_DO.get(id);

  return stub.fetch(new Request('https://internal/ws', {
    method: 'GET',
    headers: request.headers,
  }));
}

// ──────────────────────────────────────────
// Search
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

async function handleChat(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { conversation_id?: string; project_id?: string; content: string };
  if (!body.content?.trim()) return apiError('content is required', 400);

  const conversationId = body.conversation_id || generateId('conv');

  // Ensure conversation exists
  const existing = await env.DB.prepare('SELECT id FROM conversations WHERE id = ?').bind(conversationId).first();
  if (!existing) {
    await env.DB.prepare('INSERT INTO conversations (id, project_id, title, mode) VALUES (?, ?, ?, ?)').bind(
      conversationId,
      body.project_id ?? null,
      'Chat conversation',
      'chat'
    ).run();
  }

  const userMessageId = generateId('msg');
  await env.DB.prepare('INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)')
    .bind(userMessageId, conversationId, 'user', body.content)
    .run();

  // Simple deterministic assistant response with subtle RAG context from documents
  let responseText = `Got it. I heard: "${body.content.trim()}".`;
  if (body.project_id) {
    const docs = await env.DB.prepare('SELECT name FROM documents WHERE project_id = ? LIMIT 2')
      .bind(body.project_id).all<{ name: string }>();
    if (docs.results.length > 0) {
      responseText += ` I also found ${docs.results.length} knowledge documents in this project: ${docs.results.map(d => d.name).join(', ')}.`;
    }
  }

  const assistantMessageId = generateId('msg');
  await env.DB.prepare('INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)')
    .bind(assistantMessageId, conversationId, 'assistant', responseText)
    .run();

  const messages = await env.DB.prepare('SELECT id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
    .bind(conversationId).all();

  return apiJson({ success: true, data: { conversation_id: conversationId, response: responseText, messages: messages.results } });
}

// ──────────────────────────────────────────
// Task Approval
// ──────────────────────────────────────────

async function handleTaskApproval(request: Request, env: Env, pathname: string): Promise<Response> {
  const match = pathname.match(/^\/api\/tasks\/([^/]+)\/approve$/);
  if (!match) return apiError('Invalid task approval path', 400);

  const taskId = match[1];
  const body = await request.json() as { approved: boolean; reason?: string; conversation_id: string };

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
// Static Assets (SPA fallback)
// ──────────────────────────────────────────

async function serveStaticAssets(request: Request, env: Env, pathname: string): Promise<Response> {
  try {
    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) return assetResponse;

    // SPA fallback — serve index.html for all non-API routes
    const indexRequest = new Request(new URL('/index.html', request.url).toString(), request);
    return env.ASSETS.fetch(indexRequest);
  } catch {
    return new Response('Not Found', { status: 404 });
  }
}
