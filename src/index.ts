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
  handleBrainExtract,
  handleSettings,
  handleWorkflows,
} from './api/handlers';
import {
  handleRegister,
  handleVerifyEmail,
  handleLogin,
  handleForgotPassword,
  handleResetPassword,
  handleLogout,
} from "./api/auth-handlers";
import { handleExportDocx } from './api/export-handlers';
import { ConversationDurableObject } from './durable-objects/ConversationDO';
import { DocumentIngestionWorkflow } from './workflows/DocumentIngestionWorkflow';
import { ProposalAgent } from './agents/ProposalAgent';
import { ResearchAgent } from './agents/ResearchAgent';
import { WriterAgent } from './agents/WriterAgent';
import { EditorAgent } from './agents/EditorAgent';
import { PricingAgent } from './agents/PricingAgent';

// Re-export imported classes so Wrangler can find them
export { ConversationDurableObject, DocumentIngestionWorkflow, ProposalAgent, ResearchAgent, WriterAgent, EditorAgent, PricingAgent };

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
  if (pathname === "/api/auth/register") return handleRegister(request, env);
  if (pathname === "/api/auth/verify-email") return handleVerifyEmail(request, env);
  if (pathname === "/api/auth/login") return handleLogin(request, env);
  if (pathname === "/api/auth/forgot-password") return handleForgotPassword(request, env);
  if (pathname === "/api/auth/reset-password") return handleResetPassword(request, env);
  if (pathname === "/api/auth/logout") return handleLogout(request, env);

  const exportMatch = pathname.match(/^\/api\/proposals\/([^/]+)\/export$/);
  if (exportMatch && request.method === 'GET') {
    return handleExportDocx(request, env, exportMatch[1]);
  }

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

  if (pathname === '/api/brain/extract' && request.method === 'POST')
    return handleBrainExtract(request, env);

  if (pathname.match(/^\/api\/brain(\/.*)?$/))
    return handleBrain(request, env);

  if (pathname.match(/^\/api\/settings(\/.*)?$/))
    return handleSettings(request, env);

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
  const body = await request.json() as { conversation_id?: string; project_id?: string; content: string; mode?: string };
  if (!body.content?.trim()) return apiError('content is required', 400);

  const { runAgent } = await import('./agents/ProposalAgent');
  const conversationId = body.conversation_id || generateId('conv');
  const mode = body.mode ?? 'general';

  // Ensure conversation exists
  const existing = await env.DB.prepare('SELECT id FROM conversations WHERE id = ?').bind(conversationId).first();
  if (!existing) {
    await env.DB.prepare('INSERT INTO conversations (id, project_id, title, mode) VALUES (?, ?, ?, ?)').bind(
      conversationId,
      body.project_id ?? null,
      'Chat conversation',
      mode
    ).run();
  }

  // Save the user's message first
  const userMessageId = generateId('msg');
  await env.DB.prepare('INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)')
    .bind(userMessageId, conversationId, 'user', body.content)
    .run();

  // Load prior turns for context (last 40 messages, chronological, excluding
  // the one we just saved — runAgent takes the new message separately)
  const priorMsgs = await env.DB.prepare(
    `SELECT role, content FROM messages WHERE conversation_id = ? AND role IN ('user','assistant') ORDER BY created_at DESC LIMIT 41`
  ).bind(conversationId).all<{ role: string; content: string }>();
  const history = priorMsgs.results
    .reverse()
    .slice(0, -1) // drop the user message we just inserted — passed separately below
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  // Collect streamed events (tool calls, citations, approvals) so the plain
  // HTTP caller still sees full agent activity, not just the final text.
  const streamEvents: unknown[] = [];

  try {
    // Run the REAL agentic loop — Claude + tool use (search_knowledge_base,
    // create_compliance_matrix, generate_executive_summary, human-in-the-loop
    // approvals, etc.) — same agent the WebSocket path uses.
    const assistantMessage = await runAgent(
      body.content,
      history,
      env,
      conversationId,
      body.project_id,
      mode,
      async (event) => { streamEvents.push(event); }
    );

    await env.DB.prepare(`
      INSERT INTO messages (id, conversation_id, role, content, tool_calls, citations, agent_thoughts, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      assistantMessage.id,
      conversationId,
      assistantMessage.role,
      assistantMessage.content,
      assistantMessage.tool_calls ? JSON.stringify(assistantMessage.tool_calls) : null,
      assistantMessage.citations ? JSON.stringify(assistantMessage.citations) : null,
      assistantMessage.agent_thoughts ?? null,
      assistantMessage.metadata ? JSON.stringify(assistantMessage.metadata) : null
    ).run();

    const messages = await env.DB.prepare('SELECT id, role, content, tool_calls, citations, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
      .bind(conversationId).all();

    return apiJson({
      success: true,
      data: {
        conversation_id: conversationId,
        response: assistantMessage.content,
        tool_calls: assistantMessage.tool_calls ?? [],
        citations: assistantMessage.citations ?? [],
        events: streamEvents,
        messages: messages.results,
      },
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return apiError(`Agent error: ${errMsg}`, 500);
  }
}

async function handleTaskApproval(request: Request, env: Env, pathname: string): Promise<Response> {
  const taskId = pathname.split('/')[3];
  if (!taskId) return apiError('task_id required', 400);

  const body = await request.json() as { approved: boolean; reason?: string };

  const task = await env.DB.prepare('SELECT * FROM agent_tasks WHERE id = ?').bind(taskId).first();
  if (!task) return apiError('Task not found', 404);

  const status = body.approved ? 'approved' : 'rejected';
  await env.DB.prepare('UPDATE agent_tasks SET status = ?, rejection_reason = ?, updated_at = ? WHERE id = ?')
    .bind(status, body.reason ?? null, new Date().toISOString(), taskId)
    .run();

  return apiJson({ success: true, data: { id: taskId, status } });
}

async function serveStaticAssets(request: Request, env: Env, pathname: string): Promise<Response> {
  if (env.ASSETS) {
    return env.ASSETS.fetch(request);
  }
  return new Response(`MurryAI Asset placeholder for ${pathname}`, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
