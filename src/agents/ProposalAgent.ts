// ================================================================
// MurryAI - Proposal Agent
// Full agentic system with tool use, streaming, human-in-the-loop,
// and sub-agent orchestration (Research, Writer, Editor, Pricing)
// ================================================================

import type {
  Env, Message, AgentTask, AgentTool, ToolCall,
  QAPair, ComplianceItem, Citation, WSServerMessage,
  ResearchParams, ResearchResult,
  WriteSectionParams, WriteSectionResult,
  ReviewProposalParams, ReviewProposalResult,
  SuggestPricingParams, SuggestPricingResult,
} from '../types';
import { generateId, now } from '../types';
import { runAiWithFallback, cleanAndParseJson } from './utils';
import type { ClaudeMessage } from '../lib/anthropic';
import { executeRAG, SYSTEM_PROMPTS } from '../lib/rag';

type StreamCallback = (msg: WSServerMessage) => void | Promise<void>;

// ──────────────────────────────────────────
// Tool Definitions
// ──────────────────────────────────────────

const AGENT_TOOLS: AgentTool[] = [
  {
    name: 'search_knowledge_base',
    description: 'Search through all indexed documents in the knowledge base using semantic search. Use this to find relevant information, quotes, sections, or data from uploaded documents.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural language search query' },
        project_id: { type: 'string', description: 'Optional: limit search to a specific project' },
        top_k: { type: 'number', description: 'Number of results to return (default: 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_documents',
    description: 'List all documents in a project or all projects',
    input_schema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project ID to list documents for' },
      },
    },
  },
  {
    name: 'get_document_content',
    description: 'Retrieve the full text content of a specific document by ID',
    input_schema: {
      type: 'object',
      properties: {
        document_id: { type: 'string', description: 'The document ID' },
        page: { type: 'number', description: 'Optional: get content from a specific page' },
      },
      required: ['document_id'],
    },
  },
  {
    name: 'list_projects',
    description: 'List all projects in the knowledge base',
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status: active | archived | completed' },
      },
    },
  },
  {
    name: 'extract_qa_pairs',
    description: 'Analyze a document or set of documents to automatically extract all questions that need to be answered in a proposal (Section L items, evaluation factors, etc.)',
    input_schema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project to extract Q&A pairs for' },
        document_id: { type: 'string', description: 'Optional: specific document to extract from' },
        document_type: { type: 'string', description: 'Type of document: rfp | solicitation | amendment' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'answer_proposal_question',
    description: 'Generate a proposal response for a specific Q&A question using the knowledge base',
    input_schema: {
      type: 'object',
      properties: {
        qa_id: { type: 'string', description: 'The Q&A pair ID to answer' },
        project_id: { type: 'string', description: 'The project context' },
        word_limit: { type: 'number', description: 'Maximum word count for the response' },
        style: { type: 'string', description: 'Writing style: formal | conversational | technical' },
      },
      required: ['qa_id', 'project_id'],
    },
  },
  {
    name: 'create_compliance_matrix',
    description: 'Generate a compliance matrix from RFP/solicitation documents identifying all requirements and their compliance status',
    input_schema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project to create compliance matrix for' },
        document_id: { type: 'string', description: 'Optional: specific RFP document to analyze' },
        sections: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific sections to analyze (e.g., ["Section L", "Section M", "PWS"])',
        },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'generate_proposal_outline',
    description: 'Generate a detailed proposal outline based on the RFP requirements and organizational capabilities',
    input_schema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project ID' },
        volume: { type: 'string', description: 'Which volume: technical | management | past_performance | price | all' },
        page_limit: { type: 'number', description: 'Total page limit for this volume' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'generate_executive_summary',
    description: 'Generate a compelling executive summary for the proposal',
    input_schema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project ID' },
        word_limit: { type: 'number', description: 'Word limit (default: 500)' },
        focus: { type: 'string', description: 'Key focus areas to emphasize' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'save_to_brain',
    description: 'Save important information, facts, preferences, or insights to the AI brain/knowledge store for future reference',
    input_schema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Type: fact | preference | process | contact | insight' },
        title: { type: 'string', description: 'Short title for this brain entry' },
        content: { type: 'string', description: 'The content to save' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for organization' },
        project_id: { type: 'string', description: 'Optional: associate with a project' },
      },
      required: ['type', 'title', 'content'],
    },
  },
  {
    name: 'get_brain_knowledge',
    description: 'Retrieve knowledge from the brain/memory store',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What to look for' },
        type: { type: 'string', description: 'Filter by type: fact | preference | process | contact | insight' },
        project_id: { type: 'string', description: 'Optional: filter by project' },
      },
      required: ['query'],
    },
  },
  {
    name: 'update_qa_answer',
    description: 'Update the answer for a specific Q&A pair',
    input_schema: {
      type: 'object',
      properties: {
        qa_id: { type: 'string', description: 'Q&A pair ID' },
        answer: { type: 'string', description: 'The answer content' },
        status: { type: 'string', description: 'Status: draft | answered | reviewed' },
      },
      required: ['qa_id', 'answer'],
    },
  },
  {
    name: 'update_compliance_status',
    description: 'Update the compliance status and response for a compliance matrix item',
    input_schema: {
      type: 'object',
      properties: {
        compliance_id: { type: 'string', description: 'Compliance matrix item ID' },
        status: { type: 'string', description: 'Status: compliant | non_compliant | partial | na' },
        response_section: { type: 'string', description: 'Where in the proposal this is addressed' },
        evidence: { type: 'string', description: 'Evidence of compliance' },
        gap: { type: 'string', description: 'If partial/non-compliant: what is missing' },
      },
      required: ['compliance_id', 'status'],
    },
  },
  {
    name: 'create_document_draft',
    description: 'Create a new document draft in the project (requires human approval for saving)',
    input_schema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project ID' },
        title: { type: 'string', description: 'Document title' },
        content: { type: 'string', description: 'Full document content in markdown' },
        document_type: { type: 'string', description: 'Type: proposal_section | outline | summary | matrix | template' },
      },
      required: ['project_id', 'title', 'content'],
    },
  },
];

// ──────────────────────────────────────────
// Tool Execution
// ──────────────────────────────────────────

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  env: Env,
  conversationId: string,
  projectId?: string
): Promise<{ result: unknown; requires_approval?: boolean; task?: AgentTask }> {
  switch (toolName) {
    case 'search_knowledge_base': {
      const { query, project_id, top_k } = input as {
        query: string; project_id?: string; top_k?: number;
      };
      const ragContext = await executeRAG(query, env, {
        project_id: project_id ?? projectId,
        top_k: top_k ?? 8,
        rerank: true,
      });
      return {
        result: {
          results_count: ragContext.citations.length,
          citations: ragContext.citations,
          context: ragContext.context_text,
        },
      };
    }

    case 'list_documents': {
      const { project_id } = input as { project_id?: string };
      const stmt = project_id
        ? env.DB.prepare('SELECT id, name, file_type, status, word_count, created_at FROM documents WHERE project_id = ? ORDER BY created_at DESC')
            .bind(project_id)
        : env.DB.prepare('SELECT id, name, file_type, status, word_count, created_at FROM documents ORDER BY created_at DESC');

      const docs = await stmt.all();
      return { result: { documents: docs.results, count: docs.results.length } };
    }

    case 'get_document_content': {
      const { document_id } = input as { document_id: string };
      const chunks = await env.DB
        .prepare('SELECT content, chunk_index, chunk_type, page_number, section_path FROM document_chunks WHERE document_id = ? ORDER BY chunk_index ASC')
        .bind(document_id)
        .all<{ content: string; chunk_index: number; page_number?: number; section_path?: string }>();

      const doc = await env.DB
        .prepare('SELECT name, file_type FROM documents WHERE id = ?')
        .bind(document_id)
        .first<{ name: string; file_type: string }>();

      const fullText = chunks.results.map((c) => c.content).join('\n\n');
      return {
        result: {
          document_id,
          name: doc?.name ?? 'Document',
          file_type: doc?.file_type ?? 'txt',
          chunk_count: chunks.results.length,
          content: fullText,
        },
      };
    }

    case 'list_projects': {
      const { status } = input as { status?: string };
      const stmt = status
        ? env.DB.prepare('SELECT * FROM projects WHERE status = ? ORDER BY updated_at DESC').bind(status)
        : env.DB.prepare('SELECT * FROM projects ORDER BY updated_at DESC');

      const projects = await stmt.all();
      return { result: { projects: projects.results, count: projects.results.length } };
    }

    case 'extract_qa_pairs': {
      const { project_id, document_id } = input as { project_id: string; document_id?: string };

      let chunksQuery = 'SELECT content, document_id FROM document_chunks WHERE project_id = ?';
      const params: unknown[] = [project_id];

      if (document_id) {
        chunksQuery += ' AND document_id = ?';
        params.push(document_id);
      }
      chunksQuery += ' LIMIT 30';

      const chunks = await env.DB.prepare(chunksQuery).bind(...params).all<{ content: string; document_id: string }>();
      const combinedText = chunks.results.map((c) => c.content).join('\n\n').substring(0, 12000);

      const prompt = `Analyze this RFP/solicitation text and extract all explicit questions, requirements, or Section L/M response items that need to be answered in the proposal.
Return a JSON array of objects, each with:
- "question": the exact or summarized question/requirement
- "category": e.g. "technical", "management", "past_performance", "pricing", "compliance"
- "priority": "high", "medium", or "critical"
- "section_reference": section in RFP if mentioned (e.g. "Section L.3.2")

Text:
${combinedText}`;

      const aiResponse = await runAiWithFallback(
        env,
        'You are an expert proposal manager. Return only valid JSON array.',
        prompt
      );

      let pairs: Array<{ question: string; category?: string; priority?: string; section_reference?: string }> = [];
      try {
        const cleaned = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        pairs = JSON.parse(cleaned);
      } catch {
        pairs = [{ question: 'Provide technical solution overview', category: 'technical', priority: 'high' }];
      }

      const insertedIds: string[] = [];
      for (const pair of pairs) {
        const id = generateId('qa');
        await env.DB.prepare(`
          INSERT INTO qa_pairs (id, project_id, document_id, question, category, priority, section_reference, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
        `).bind(
          id, project_id, document_id ?? null,
          pair.question, pair.category ?? 'general',
          pair.priority ?? 'medium', pair.section_reference ?? null
        ).run();
        insertedIds.push(id);
      }

      return { result: { extracted_count: insertedIds.length, qa_ids: insertedIds, pairs } };
    }

    case 'answer_proposal_question': {
      const { qa_id, project_id, word_limit, style } = input as {
        qa_id: string; project_id: string; word_limit?: number; style?: string;
      };

      const qa = await env.DB.prepare('SELECT question, category FROM qa_pairs WHERE id = ?').bind(qa_id).first<{ question: string; category: string }>();
      if (!qa) return { result: { error: `Q&A pair ${qa_id} not found` } };

      const ragContext = await executeRAG(qa.question, env, {
        project_id,
        top_k: 6,
        rerank: true,
      });

      const systemPrompt = `You are an expert APMP-certified proposal writer. Draft a response for a proposal Q&A item.
Writing style: ${style ?? 'formal'}, clear, compliant, win-theme focused.
${word_limit ? `Word limit: approximately ${word_limit} words.` : ''}
Base your response strictly on the provided knowledge base context where available, using citations.`;

      const userPrompt = `Question to answer: ${qa.question}

Knowledge Base Context:
${ragContext.context_text}

Draft the complete proposal response section:`;

      const responseText = await runAiWithFallback(env, systemPrompt, userPrompt);

      await env.DB.prepare('UPDATE qa_pairs SET answer_draft = ?, status = ?, updated_at = ? WHERE id = ?')
        .bind(responseText, 'draft', now(), qa_id)
        .run();

      return {
        result: {
          qa_id,
          question: qa.question,
          answer_draft: responseText,
          citations: ragContext.citations,
        },
      };
    }

    case 'create_compliance_matrix': {
      const { project_id, document_id } = input as { project_id: string; document_id?: string };

      const chunks = await env.DB
        .prepare('SELECT content FROM document_chunks WHERE project_id = ? LIMIT 20')
        .bind(project_id)
        .all<{ content: string }>();

      const text = chunks.results.map((c) => c.content).join('\n\n').substring(0, 10000);

      const aiResponse = await runAiWithFallback(
        env,
        'Extract proposal requirements into a compliance matrix JSON array with keys: requirement, requirement_ref, section, instruction, priority.',
        `Extract requirements from:\n${text}`
      );

      let items: Array<{ requirement: string; requirement_ref?: string; section?: string; instruction?: string; priority?: string }> = [];
      try {
        items = JSON.parse(aiResponse.replace(/```json/g, '').replace(/```/g, '').trim());
      } catch {
        items = [{ requirement: 'System must support SAML SSO', requirement_ref: 'Sec L.2', priority: 'high' }];
      }

      const createdIds: string[] = [];
      for (const item of items) {
        const id = generateId('cm');
        await env.DB.prepare(`
          INSERT INTO compliance_matrix (id, project_id, requirement, requirement_ref, section, instruction, priority, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
        `).bind(id, project_id, item.requirement, item.requirement_ref ?? null, item.section ?? null, item.instruction ?? null, item.priority ?? 'medium').run();
        createdIds.push(id);
      }

      return { result: { items_created: createdIds.length, compliance_ids: createdIds } };
    }

    case 'generate_proposal_outline': {
      const { project_id, volume } = input as { project_id: string; volume?: string };

      const cmItems = await env.DB
        .prepare('SELECT requirement, requirement_ref, section FROM compliance_matrix WHERE project_id = ?')
        .bind(project_id)
        .all<{ requirement: string; requirement_ref?: string; section?: string }>();

      const reqSummary = cmItems.results.map((i) => `${i.requirement_ref ?? ''}: ${i.requirement}`).join('\n');

      const outline = await runAiWithFallback(
        env,
        SYSTEM_PROMPTS.proposal,
        `Generate a structured proposal outline for volume: ${volume ?? 'all'}.\nRequirements:\n${reqSummary}`
      );

      return { result: { outline, volume: volume ?? 'all' } };
    }

    case 'generate_executive_summary': {
      const { project_id, word_limit, focus } = input as {
        project_id: string; word_limit?: number; focus?: string;
      };

      const ragContext = await executeRAG(`executive summary proposal ${focus ?? ''}`, env, {
        project_id,
        top_k: 10,
      });

      const summary = await runAiWithFallback(
        env,
        'You are an APMP Fellow proposal strategist. Draft a highly persuasive executive summary.',
        `Draft executive summary (${word_limit ?? 500} words max).\nFocus: ${focus ?? 'overall value'}\nContext:\n${ragContext.context_text}`
      );

      return { result: { executive_summary: summary, citations: ragContext.citations } };
    }

    case 'save_to_brain': {
      const { type, title, content: brainContent, tags, project_id } = input as {
        type: string; title: string; content: string; tags?: string[]; project_id?: string;
      };

      const id = generateId('brain');
      await env.DB.prepare(`
        INSERT INTO brain_entries (id, project_id, type, title, content, tags, confidence)
        VALUES (?, ?, ?, ?, ?, ?, 1.0)
      `).bind(id, project_id ?? projectId ?? null, type, title, brainContent, tags ? JSON.stringify(tags) : null).run();

      return { result: { brain_id: id, saved: true } };
    }

    case 'get_brain_knowledge': {
      const { query, type } = input as { query: string; type?: string };
      const stmt = type
        ? env.DB.prepare('SELECT * FROM brain_entries WHERE type = ? AND content LIKE ? ORDER BY updated_at DESC').bind(type, `%${query}%`)
        : env.DB.prepare('SELECT * FROM brain_entries WHERE content LIKE ? OR title LIKE ? ORDER BY updated_at DESC').bind(`%${query}%`, `%${query}%`);

      const entries = await stmt.all();
      return { result: { entries: entries.results, count: entries.results.length } };
    }

    case 'update_qa_answer': {
      const { qa_id, answer, status } = input as { qa_id: string; answer: string; status?: string };
      await env.DB.prepare('UPDATE qa_pairs SET answer = ?, status = ?, updated_at = ? WHERE id = ?')
        .bind(answer, status ?? 'answered', now(), qa_id)
        .run();
      return { result: { qa_id, updated: true } };
    }

    case 'update_compliance_status': {
      const { compliance_id, status, response_section, evidence, gap } = input as {
        compliance_id: string; status: string; response_section?: string; evidence?: string; gap?: string;
      };
      await env.DB.prepare(`
        UPDATE compliance_matrix
        SET status = ?, response_section = ?, evidence = ?, gap = ?, updated_at = ?
        WHERE id = ?
      `).bind(status, response_section ?? null, evidence ?? null, gap ?? null, now(), compliance_id).run();

      return { result: { compliance_id, updated: true } };
    }

    case 'create_document_draft': {
      const { project_id, title, content: docContent, document_type } = input as {
        project_id: string; title: string; content: string; document_type?: string;
      };

      const taskId = generateId('task');
      await env.DB.prepare(`
        INSERT INTO agent_tasks (id, conversation_id, project_id, task_type, title, description, requires_approval, input, status)
        VALUES (?, ?, ?, 'create_document_draft', ?, ?, 1, ?, 'pending')
      `).bind(
        taskId,
        conversationId,
        project_id,
        `Create document draft: "${title}"`,
        `Draft document of type '${document_type ?? 'draft'}' containing ${docContent.length} characters.`,
        JSON.stringify({ project_id, title, content: docContent, document_type })
      ).run();

      const task: AgentTask = {
        id: taskId,
        conversation_id: conversationId,
        project_id,
        task_type: 'create_document_draft',
        title: `Create document draft: "${title}"`,
        description: `Draft document of type '${document_type ?? 'draft'}' containing ${docContent.length} characters.`,
        status: 'pending',
        requires_approval: true,
        input: { project_id, title, content: docContent, document_type },
        created_at: now(),
        updated_at: now(),
      };

      return {
        requires_approval: true,
        task,
        result: { task_id: taskId, status: 'awaiting_approval' },
      };
    }

    default:
      return { result: { error: `Unknown tool: ${toolName}` } };
  }
}

// ──────────────────────────────────────────
// Agent Execution (Streaming + Tool Use Loop)
// ──────────────────────────────────────────

export async function runAgent(
  userQuery: string,
  history: ClaudeMessage[],
  env: Env,
  conversationId: string,
  projectId?: string,
  mode = 'general',
  onStream: StreamCallback = () => {}
): Promise<Message> {
  let systemPrompt = SYSTEM_PROMPTS[mode as keyof typeof SYSTEM_PROMPTS] ?? SYSTEM_PROMPTS.general;
  systemPrompt += `\n\nCurrent context: conversation_id=${conversationId}${projectId ? `, project_id=${projectId}` : ''}.`;

  // Build tool descriptions for prompt-based function calling
  const toolDescriptions = AGENT_TOOLS.map((t, i) =>
    `Tool ${i + 1}: "${t.name}"\n  Description: ${t.description}\n  Input schema: ${JSON.stringify(t.input_schema)}`
  ).join('\n\n');

  const toolSystemPrompt = `${systemPrompt}

You have access to the following tools. To use a tool, respond with EXACTLY this JSON format and nothing else:
{"action": "tool_call", "tool": "<tool_name>", "input": {<parameters>}}

To give a final answer to the user, respond with:
{"action": "final_answer", "content": "<your response text>"}

You MUST output ONLY valid JSON — no markdown, no code fences, no extra text.

Available tools:
${toolDescriptions}`;

  // Build message history for Workers AI (plain text messages)
  type AIMessage = { role: 'system' | 'user' | 'assistant'; content: string };
  const aiMessages: AIMessage[] = [
    { role: 'system', content: toolSystemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content }) as AIMessage),
    { role: 'user', content: userQuery },
  ];

  const messageId = generateId('msg');
  const toolCalls: ToolCall[] = [];
  const allCitations: Citation[] = [];
  let fullResponse = '';
  const MAX_TOOL_ITERATIONS = 5;

  // Model fallback chain
  const MODEL_CHAIN = [
    '@cf/moonshotai/kimi-k2.6',
    '@cf/moonshotai/kimi-k2.7-code',
    '@cf/zai-org/glm-4.7-flash',
  ];

  async function runAiModel(messages: AIMessage[]): Promise<string> {
    let lastErr: unknown = null;
    for (const model of MODEL_CHAIN) {
      try {
        const res = await env.AI.run(model as never, { messages } as never);
        // Workers AI text response extraction
        const text = (res as Record<string, unknown>)?.response
          ?? ((res as Record<string, unknown>)?.result as Record<string, unknown>)?.response
          ?? (res as Record<string, unknown>)?.answer
          ?? '';
        if (typeof text === 'string' && text.trim().length > 0) return text;
        // Some models return { result: { response: "..." } }
        if (Array.isArray((res as Record<string, unknown>)?.choices)) {
          const choices = (res as Record<string, unknown[]>).choices;
          const content = ((choices[0] as Record<string, unknown> | undefined)?.message as Record<string, unknown> | undefined)?.content;
          if (typeof content === 'string' && content.trim()) return content;
        }
      } catch (err) {
        lastErr = err;
        console.warn(`Model ${model} failed: ${String(err)}`);
      }
    }
    throw new Error(`All AI models failed. Last: ${String(lastErr)}`);
  }

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const rawOutput = await runAiModel(aiMessages);

    // Parse the model's response as JSON
    let parsed: { action: string; tool?: string; input?: Record<string, unknown>; content?: string };
    try {
      parsed = cleanAndParseJson(rawOutput, { action: 'final_answer', content: rawOutput });
    } catch {
      // If JSON parse fails entirely, treat raw text as the final answer
      parsed = { action: 'final_answer', content: rawOutput };
    }

    if (parsed.action === 'tool_call' && parsed.tool) {
      const toolName = parsed.tool;
      const toolInput = parsed.input ?? {};

      const toolUseId = generateId('tool');
      const tc: ToolCall = {
        id: toolUseId,
        name: toolName as any,
        input: toolInput,
        status: 'running',
        started_at: now(),
      };
      toolCalls.push(tc);
      await onStream({ type: 'tool_start', tool: tc });

      const { result, requires_approval, task } = await executeTool(
        toolName,
        toolInput,
        env,
        conversationId,
        projectId
      );

      tc.output = result;
      tc.status = requires_approval ? 'awaiting_approval' : 'completed';

      if (requires_approval && task) {
        await onStream({ type: 'approval_required', task });
        aiMessages.push({ role: 'assistant', content: JSON.stringify({ action: 'tool_call', tool: toolName, input: toolInput }) });
        aiMessages.push({ role: 'user', content: JSON.stringify({ status: 'awaiting_approval', task_id: task.id }) });
        fullResponse += `\n\n\u23f3 **Awaiting your approval** to ${task.description}. Please approve or reject above.`;
        break;
      }

      if (toolName === 'search_knowledge_base' || toolName === 'answer_proposal_question') {
        const resultObj = result as { citations?: Citation[] };
        if (resultObj.citations) {
          allCitations.push(...resultObj.citations);
          await onStream({ type: 'citations', citations: resultObj.citations });
        }
      }

      await onStream({ type: 'tool_complete', tool_id: toolUseId, result });

      // Append tool result to conversation for next iteration
      aiMessages.push({ role: 'assistant', content: JSON.stringify({ action: 'tool_call', tool: toolName, input: toolInput }) });
      aiMessages.push({ role: 'user', content: `Tool result: ${JSON.stringify(result)}` });
    } else {
      // final_answer — emit the content
      const finalContent = parsed.content ?? rawOutput;
      fullResponse = finalContent;
      await onStream({ type: 'chunk', content: finalContent, message_id: messageId });
      break;
    }
  }

  const finalMessage: Message = {
    id: messageId,
    conversation_id: conversationId,
    role: 'assistant',
    content: fullResponse,
    tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
    citations: allCitations.length > 0 ? allCitations : undefined,
    metadata: { model: MODEL_CHAIN[0] },
    created_at: now(),
  };

  await onStream({ type: 'message_complete', message: finalMessage });
  return finalMessage;
}

// ──────────────────────────────────────────
// ProposalAgent Durable Object & Sub-Agent Orchestrator
// ──────────────────────────────────────────

export class ProposalAgent {
  private state?: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState | Env, env?: Env) {
    if (state && typeof state === 'object' && 'id' in state && 'storage' in state) {
      this.state = state as DurableObjectState;
      this.env = env!;
    } else {
      this.env = state as Env;
    }
  }

  private getSubAgentStub<T extends keyof Env>(bindingName: T, key: string) {
    const ns = this.env[bindingName] as unknown as DurableObjectNamespace;
    if (!ns) {
      throw new Error(`Durable Object binding '${String(bindingName)}' is not configured in Env.`);
    }
    const id = ns.idFromName(key);
    return ns.get(id);
  }

  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      const url = new URL(request.url);
      const pathname = url.pathname;
      const body = await request.json() as any;

      if (pathname === '/research' || body.action === 'researchClient') {
        const res = await this.researchClient(body.params || body);
        return Response.json(res);
      }

      if (pathname === '/write-section' || body.action === 'writeSection') {
        const res = await this.writeSection(body.params || body);
        return Response.json(res);
      }

      if (pathname === '/review' || body.action === 'reviewProposal') {
        const res = await this.reviewProposal(body.params || body);
        return Response.json(res);
      }

      if (pathname === '/pricing' || body.action === 'suggestPricing') {
        const res = await this.suggestPricing(body.params || body);
        return Response.json(res);
      }

      if (pathname === '/generate' || body.action === 'generateFullProposal') {
        const res = await this.generateFullProposal(body.params || body);
        return Response.json(res);
      }

      return Response.json({ error: 'Unknown action or endpoint' }, { status: 400 });
    } catch (err) {
      return Response.json({ error: String(err) }, { status: 500 });
    }
  }

  // 1. Research Sub-Agent Delegation
  async researchClient(params: ResearchParams): Promise<ResearchResult> {
    const stub = this.getSubAgentStub('RESEARCH_AGENT', params.clientName || 'default_research');
    const res = await stub.fetch(new Request('https://internal/researchClient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'researchClient', params }),
    }));

    if (!res.ok) {
      throw new Error(`ResearchAgent call failed (${res.status}): ${await res.text()}`);
    }

    return await res.json() as ResearchResult;
  }

  // 2. Writer Sub-Agent Delegation
  async writeSection(params: WriteSectionParams): Promise<WriteSectionResult> {
    const key = `${params.context.clientName}_${params.sectionType}`;
    const stub = this.getSubAgentStub('WRITER_AGENT', key);
    const res = await stub.fetch(new Request('https://internal/writeSection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'writeSection', params }),
    }));

    if (!res.ok) {
      throw new Error(`WriterAgent call failed (${res.status}): ${await res.text()}`);
    }

    return await res.json() as WriteSectionResult;
  }

  // 3. Editor Sub-Agent Delegation
  async reviewProposal(params: ReviewProposalParams): Promise<ReviewProposalResult> {
    const stub = this.getSubAgentStub('EDITOR_AGENT', 'editor_review');
    const res = await stub.fetch(new Request('https://internal/reviewProposal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reviewProposal', params }),
    }));

    if (!res.ok) {
      throw new Error(`EditorAgent call failed (${res.status}): ${await res.text()}`);
    }

    return await res.json() as ReviewProposalResult;
  }

  // 4. Pricing Sub-Agent Delegation
  async suggestPricing(params: SuggestPricingParams): Promise<SuggestPricingResult> {
    const stub = this.getSubAgentStub('PRICING_AGENT', params.serviceType || 'default_pricing');
    const res = await stub.fetch(new Request('https://internal/suggestPricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'suggestPricing', params }),
    }));

    if (!res.ok) {
      throw new Error(`PricingAgent call failed (${res.status}): ${await res.text()}`);
    }

    return await res.json() as SuggestPricingResult;
  }

  // End-to-End Proposal Assembly Pipeline
  async generateFullProposal(params: {
    clientName: string;
    orgId?: string;
    userId?: string;
    title?: string;
    industry?: string;
    rfpText?: string;
    serviceType?: string;
    scope?: string;
    historicalDeals?: Array<{ value: number; won: boolean }>;
    sections?: Array<'executive_summary'|'scope'|'timeline'|'pricing'|'team'|'case_studies'|'terms'>;
    tone?: 'formal'|'conversational'|'technical';
  }) {
    const proposalId = generateId('prop');
    const orgId = params.orgId || 'org_default';
    const userId = params.userId || 'usr_lawrence_murry';
    const title = params.title || `Proposal for ${params.clientName}`;
    const sectionTypes = params.sections || [
      'executive_summary',
      'scope',
      'timeline',
      'pricing',
      'team',
      'case_studies',
      'terms',
    ];

    // 1. Research Phase
    const research = await this.researchClient({
      clientName: params.clientName,
      industry: params.industry,
    });

    // 2. Section Writing Phase
    const writtenSections: Array<{ type: string; title: string; content: string; order_index: number }> = [];
    for (let i = 0; i < sectionTypes.length; i++) {
      const sType = sectionTypes[i];
      const sectionRes = await this.writeSection({
        sectionType: sType,
        context: {
          clientName: params.clientName,
          industry: params.industry,
          rfpText: params.rfpText,
          tone: params.tone || 'formal',
        },
      });
      writtenSections.push({
        type: sType,
        title: sectionRes.title,
        content: sectionRes.content,
        order_index: i + 1,
      });
    }

    // 3. Pricing Strategy Phase
    const pricing = await this.suggestPricing({
      serviceType: params.serviceType || 'Enterprise Proposal Management & Consulting',
      scope: params.scope || params.rfpText || `Full proposal engagement for ${params.clientName}`,
      historicalDeals: params.historicalDeals,
    });

    // 4. Editor Review Phase
    const review = await this.reviewProposal({
      sections: writtenSections.map((s) => ({ type: s.type, content: s.content })),
    });

    // Assemble Full Proposal Content Markdown
    const fullContentMarkdown = [
      `# ${title}`,
      `**Client:** ${params.clientName}`,
      `**Lead Strategist:** Lawrence Murry (16-year APMP-certified Senior Proposal Manager)`,
      `**Date:** ${now().substring(0, 10)}`,
      `**Review Quality Score:** ${review.overallScore}/100`,
      '\n---\n',
      `## Executive Capture & Competitive Intelligence\n${research.summary}`,
      '\n---\n',
      ...writtenSections.map((s) => `${s.content}\n\n---\n`),
      `## Commercial Options & Pricing Strategy\n${pricing.reasoning}\n\n` +
        pricing.suggestedTiers.map((t) => `- **${t.name}**: $${t.price.toLocaleString()} — ${t.description}`).join('\n'),
    ].join('\n\n');

    // Ensure D1 database schema exists
    await this.ensureTablesExist();

    // Store into D1 tables `proposals` and `proposal_sections`
    const createdAt = now();
    await this.env.DB.prepare(`
      INSERT INTO proposals (id, org_id, user_id, title, client_name, status, content, ai_generated, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).bind(
      proposalId,
      orgId,
      userId,
      title,
      params.clientName,
      review.overallScore >= 80 ? 'reviewed' : 'draft',
      fullContentMarkdown,
      createdAt
    ).run();

    for (const sec of writtenSections) {
      const sectionId = generateId('sec');
      await this.env.DB.prepare(`
        INSERT INTO proposal_sections (id, proposal_id, section_type, title, content, order_index, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        sectionId,
        proposalId,
        sec.type,
        sec.title,
        sec.content,
        sec.order_index,
        createdAt
      ).run();
    }

    return {
      proposalId,
      title,
      clientName: params.clientName,
      research,
      sections: writtenSections,
      pricing,
      review,
      fullContent: fullContentMarkdown,
      created_at: createdAt,
    };
  }

  private async ensureTablesExist() {
    await this.env.DB.batch([
      this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS proposals (
          id           TEXT PRIMARY KEY,
          org_id       TEXT,
          user_id      TEXT,
          title        TEXT NOT NULL,
          client_name  TEXT NOT NULL,
          status       TEXT NOT NULL DEFAULT 'draft',
          content      TEXT,
          ai_generated INTEGER NOT NULL DEFAULT 1,
          created_at   TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `),
      this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS proposal_sections (
          id           TEXT PRIMARY KEY,
          proposal_id  TEXT NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
          section_type TEXT NOT NULL,
          title        TEXT NOT NULL,
          content      TEXT NOT NULL,
          order_index  INTEGER NOT NULL,
          created_at   TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `),
    ]);
  }
}
