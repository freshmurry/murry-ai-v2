// ================================================================
// MurryAI - Conversation Durable Object
// Persistent WebSocket sessions with agentic conversation state
// ================================================================

import type { Env, Message, Conversation, WSClientMessage, WSServerMessage } from '../types';
import { generateId, now } from '../types';
import { runAgent } from '../agents/ProposalAgent';
import type { ClaudeMessage } from '../lib/anthropic';

export class ConversationDurableObject {
  private state: DurableObjectState;
  private env: Env;
  private sessions: Map<string, WebSocket> = new Map();

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }

    // REST API for this conversation
    if (request.method === 'GET' && url.pathname === '/history') {
      return this.getHistory();
    }

    if (request.method === 'POST' && url.pathname === '/approve') {
      return this.handleApproval(request);
    }

    return new Response('Not Found', { status: 404 });
  }

  // ──────────────────────────────────────────
  // WebSocket Handler
  // ──────────────────────────────────────────

  private async handleWebSocket(request: Request): Promise<Response> {
    const { 0: client, 1: server } = new WebSocketPair();

    server.accept();

    const sessionId = generateId('ws');
    this.sessions.set(sessionId, server);

    server.addEventListener('message', async (event) => {
      try {
        const msg = JSON.parse(event.data as string) as WSClientMessage;
        await this.handleMessage(msg, server, sessionId);
      } catch (err) {
        this.send(server, { type: 'error', error: String(err) });
      }
    });

    server.addEventListener('close', () => {
      this.sessions.delete(sessionId);
    });

    server.addEventListener('error', () => {
      this.sessions.delete(sessionId);
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  private async handleMessage(
    msg: WSClientMessage,
    ws: WebSocket,
    sessionId: string
  ): Promise<void> {
    switch (msg.type) {
      case 'ping':
        this.send(ws, { type: 'pong' });
        break;

      case 'subscribe':
        // Client subscribing to a conversation — load and send history
        break;

      case 'chat':
        await this.handleChatMessage(msg, ws);
        break;

      case 'approve_task':
        await this.handleTaskApproval(msg, ws);
        break;
    }
  }

  // ──────────────────────────────────────────
  // Chat Handler — runs the agentic loop
  // ──────────────────────────────────────────

  private async handleChatMessage(
    msg: Extract<WSClientMessage, { type: 'chat' }>,
    ws: WebSocket
  ): Promise<void> {
    const { content, conversation_id, project_id, mode = 'general' } = msg;

    // Ensure conversation exists
    await this.ensureConversation(conversation_id, project_id, mode);

    // Save user message
    const userMessageId = generateId('msg');
    await this.saveMessage({
      id: userMessageId,
      conversation_id,
      role: 'user',
      content,
      created_at: now(),
    });

    // Load conversation history for context (last 20 messages)
    const history = await this.loadClaudeHistory(conversation_id);

    // Stream callback — sends events to WebSocket
    const onStream = async (event: WSServerMessage) => {
      if (ws.readyState === WebSocket.OPEN) {
        this.send(ws, event);
      }
    };

    try {
      // Run the agent
      const assistantMessage = await runAgent(
        content,
        history,
        this.env,
        conversation_id,
        project_id,
        mode,
        onStream
      );

      // Save assistant message
      await this.saveMessage(assistantMessage);

      // Auto-generate conversation title if this is the first message
      const msgCount = await this.state.storage.get<number>(`conv:${conversation_id}:count`) ?? 0;
      if (msgCount === 0) {
        await this.generateAndSaveTitle(conversation_id, content);
      }
      await this.state.storage.put(`conv:${conversation_id}:count`, msgCount + 1);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.send(ws, { type: 'error', error: `Agent error: ${errorMsg}` });
    }
  }

  // ──────────────────────────────────────────
  // Human-in-the-Loop: Task Approval
  // ──────────────────────────────────────────

  private async handleTaskApproval(
    msg: Extract<WSClientMessage, { type: 'approve_task' }>,
    ws: WebSocket
  ): Promise<void> {
    const { task_id, approved, reason } = msg;

    const task = await this.env.DB.prepare('SELECT * FROM agent_tasks WHERE id = ?')
      .bind(task_id)
      .first<{
        id: string; task_type: string; input: string;
        conversation_id: string; project_id: string;
      }>();

    if (!task) {
      this.send(ws, { type: 'error', error: `Task ${task_id} not found` });
      return;
    }

    if (!approved) {
      await this.env.DB.prepare('UPDATE agent_tasks SET status = ?, rejection_reason = ?, updated_at = ? WHERE id = ?')
        .bind('rejected', reason ?? 'User rejected', now(), task_id)
        .run();

      this.send(ws, {
        type: 'chunk',
        content: `\n\n❌ Task rejected. I won't proceed with that action.${reason ? ` Reason: ${reason}` : ''}`,
        message_id: generateId('msg'),
      });
      return;
    }

    // Execute the approved task
    const input = JSON.parse(task.input) as Record<string, unknown>;

    await this.env.DB.prepare('UPDATE agent_tasks SET status = ?, updated_at = ? WHERE id = ?')
      .bind('approved', now(), task_id)
      .run();

    try {
      let result: unknown;

      if (task.task_type === 'create_document_draft') {
        const { project_id, title, content: docContent, document_type } = input as {
          project_id: string; title: string; content: string; document_type?: string;
        };

        const docId = generateId('doc');
        const r2Key = `projects/${project_id}/drafts/${docId}.md`;

        await this.env.R2.put(r2Key, docContent, {
          httpMetadata: { contentType: 'text/markdown' },
          customMetadata: { title, document_type: document_type ?? 'draft' },
        });

        await this.env.DB.prepare(`
          INSERT INTO documents (id, project_id, name, original_filename, file_type, r2_key, size_bytes, status)
          VALUES (?, ?, ?, ?, 'md', ?, ?, 'indexed')
        `).bind(docId, project_id, title, `${title}.md`, r2Key, docContent.length).run();

        result = { document_id: docId, title, saved: true };
      }

      await this.env.DB.prepare('UPDATE agent_tasks SET status = ?, output = ?, updated_at = ? WHERE id = ?')
        .bind('completed', JSON.stringify(result), now(), task_id)
        .run();

      this.send(ws, {
        type: 'chunk',
        content: `\n\n✅ Task completed successfully: ${JSON.stringify(result, null, 2)}`,
        message_id: generateId('msg'),
      });

    } catch (err) {
      this.send(ws, { type: 'error', error: `Task execution failed: ${String(err)}` });
    }
  }

  // ──────────────────────────────────────────
  // Persistence Helpers
  // ──────────────────────────────────────────

  private async ensureConversation(
    conversationId: string,
    projectId?: string,
    mode?: string
  ): Promise<void> {
    const existing = await this.env.DB.prepare('SELECT id FROM conversations WHERE id = ?')
      .bind(conversationId)
      .first();

    if (!existing) {
      await this.env.DB.prepare(`
        INSERT INTO conversations (id, project_id, title, mode) VALUES (?, ?, ?, ?)
      `).bind(conversationId, projectId ?? null, 'New Conversation', mode ?? 'general').run();
    }
  }

  private async saveMessage(message: Message): Promise<void> {
    await this.env.DB.prepare(`
      INSERT INTO messages (id, conversation_id, role, content, tool_calls, citations, agent_thoughts, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        message.id,
        message.conversation_id,
        message.role,
        message.content,
        message.tool_calls ? JSON.stringify(message.tool_calls) : null,
        message.citations ? JSON.stringify(message.citations) : null,
        message.agent_thoughts ?? null,
        message.metadata ? JSON.stringify(message.metadata) : null
      )
      .run();
  }

  private async loadClaudeHistory(conversationId: string): Promise<ClaudeMessage[]> {
    const msgs = await this.env.DB.prepare(`
      SELECT role, content FROM messages
      WHERE conversation_id = ? AND role IN ('user', 'assistant')
      ORDER BY created_at DESC LIMIT 40
    `)
      .bind(conversationId)
      .all<{ role: string; content: string }>();

    // Return in chronological order, skip the last user message (added by runAgent)
    return msgs.results
      .reverse()
      .slice(0, -1) // remove the most recent user message (it's passed separately)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
  }

  private async generateAndSaveTitle(conversationId: string, firstMessage: string): Promise<void> {
    try {
      const title = firstMessage.length > 60
        ? firstMessage.substring(0, 57) + '...'
        : firstMessage;

      await this.env.DB.prepare('UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?')
        .bind(title, now(), conversationId)
        .run();
    } catch {
      // Non-critical, ignore
    }
  }

  // ──────────────────────────────────────────
  // REST Endpoints
  // ──────────────────────────────────────────

  private async getHistory(): Promise<Response> {
    // Get conversation ID from storage context
    return new Response(JSON.stringify({ messages: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleApproval(request: Request): Promise<Response> {
    const body = await request.json() as { task_id: string; approved: boolean; reason?: string };

    // Broadcast to all connected WebSocket sessions
    for (const [, ws] of this.sessions) {
      if (ws.readyState === WebSocket.OPEN) {
        await this.handleTaskApproval({ type: 'approve_task', ...body }, ws);
        break;
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ──────────────────────────────────────────
  // WebSocket Send Helper
  // ──────────────────────────────────────────

  private send(ws: WebSocket, msg: WSServerMessage): void {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    } catch {
      // Connection closed
    }
  }
}
