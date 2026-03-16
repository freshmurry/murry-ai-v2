// ================================================================
// MurryAI - Proposal Agent
// Full agentic system with tool use, streaming, and human-in-the-loop
// ================================================================

import type {
  Env, Message, AgentTask, AgentTool, ToolCall,
  QAPair, ComplianceItem, Citation, WSServerMessage,
} from '../types';
import { generateId, now } from '../types';
import { AnthropicClient, type ClaudeContentBlock, type ClaudeMessage } from '../lib/anthropic';
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
        page?: { type: 'number', description: 'Optional: get content from a specific page' },
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
        .prepare('SELECT content, chunk_index, chunk_type, page_number, section_path FROM document_chunks WHERE document_id = ? ORDER BY chunk_index')
        .bind(document_id)
        .all<{ content: string; chunk_index: number; chunk_type: string; page_number?: number; section_path?: string }>();

      return {
        result: {
          content: chunks.results.map((c) => c.content).join('\n\n'),
          chunks: chunks.results.length,
        },
      };
    }

    case 'list_projects': {
      const { status } = input as { status?: string };
      const stmt = status
        ? env.DB.prepare('SELECT * FROM projects WHERE status = ? ORDER BY updated_at DESC').bind(status)
        : env.DB.prepare('SELECT * FROM projects ORDER BY updated_at DESC');

      const projects = await stmt.all();
      return { result: { projects: projects.results } };
    }

    case 'extract_qa_pairs': {
      const { project_id, document_id } = input as { project_id: string; document_id?: string };

      // Get document content to analyze
      const stmt = document_id
        ? env.DB.prepare('SELECT content FROM document_chunks WHERE document_id = ? ORDER BY chunk_index').bind(document_id)
        : env.DB.prepare(`
            SELECT dc.content FROM document_chunks dc
            JOIN documents d ON d.id = dc.document_id
            WHERE dc.project_id = ? AND d.name ILIKE '%rfp%' OR d.name ILIKE '%solicitation%'
            ORDER BY dc.chunk_index LIMIT 50
          `).bind(project_id);

      const chunks = await stmt.all<{ content: string }>();
      const fullText = chunks.results.map((c) => c.content).join('\n\n');

      if (!fullText) {
        return { result: { error: 'No document content found to analyze' } };
      }

      // Use AI to extract Q&A pairs
      const client = new AnthropicClient(env.ANTHROPIC_API_KEY);
      const prompt = `Analyze this RFP/solicitation document and extract ALL evaluation questions and requirements 
that need to be addressed in the proposal. For each item, identify:
- The exact question or requirement
- Section reference (Section L, M, C, PWS, etc.)
- Page reference if available  
- Category (Technical, Management, Past Performance, Price, etc.)
- Priority (critical if explicitly required, high for evaluation factors, medium otherwise)

Document content:
${fullText.substring(0, 8000)}

Return a JSON array of objects with fields: question, section_reference, page_reference, category, priority`;

      const response = await client.generateText(prompt, undefined, 2048);
      let qaPairs: Partial<QAPair>[] = [];

      try {
        const match = response.match(/\[[\s\S]*\]/);
        if (match) qaPairs = JSON.parse(match[0]);
      } catch {
        qaPairs = [];
      }

      // Store in D1
      const saved = [];
      for (const pair of qaPairs) {
        const id = generateId('qa');
        await env.DB.prepare(`
          INSERT INTO qa_pairs (id, project_id, document_id, question, section_reference, page_reference, category, priority, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `).bind(id, project_id, document_id ?? null, pair.question ?? '', pair.section_reference ?? null, pair.page_reference ?? null, pair.category ?? null, pair.priority ?? 'medium').run();
        saved.push({ id, ...pair });
      }

      return { result: { extracted: saved.length, qa_pairs: saved } };
    }

    case 'answer_proposal_question': {
      const { qa_id, project_id, word_limit, style } = input as {
        qa_id: string; project_id: string; word_limit?: number; style?: string;
      };

      const qa = await env.DB.prepare('SELECT * FROM qa_pairs WHERE id = ?')
        .bind(qa_id)
        .first<QAPair>();

      if (!qa) return { result: { error: `Q&A pair ${qa_id} not found` } };

      // Search for relevant content
      const ragCtx = await executeRAG(qa.question, env, {
        project_id,
        top_k: 6,
        rerank: true,
      });

      const client = new AnthropicClient(env.ANTHROPIC_API_KEY);
      const systemPrompt = SYSTEM_PROMPTS.qa;

      const prompt = `Generate a compelling proposal response to this evaluation question:

QUESTION: ${qa.question}
${qa.section_reference ? `SECTION REFERENCE: ${qa.section_reference}` : ''}
${word_limit ? `WORD LIMIT: ${word_limit} words maximum` : ''}
${style ? `WRITING STYLE: ${style}` : ''}

RELEVANT KNOWLEDGE BASE CONTENT:
${ragCtx.context_text || 'No specific documents found — draw on general proposal writing best practices'}

Write a complete, evaluation-score-maximizing response. Lead with your discriminator.
Use active voice. Be specific with metrics and examples where possible.
${word_limit ? `Stay under ${word_limit} words.` : ''}`;

      const answer = await client.generateText(prompt, systemPrompt, word_limit ? word_limit * 5 : 1500);

      // Auto-save draft
      await env.DB.prepare(`
        UPDATE qa_pairs SET answer_draft = ?, status = 'draft', updated_at = ?
        WHERE id = ?
      `).bind(answer, now(), qa_id).run();

      return {
        result: {
          qa_id,
          answer,
          citations: ragCtx.citations,
          word_count: answer.split(/\s+/).length,
        },
      };
    }

    case 'create_compliance_matrix': {
      const { project_id, document_id } = input as { project_id: string; document_id?: string };

      const stmt = document_id
        ? env.DB.prepare('SELECT content FROM document_chunks WHERE document_id = ? ORDER BY chunk_index').bind(document_id)
        : env.DB.prepare('SELECT dc.content FROM document_chunks dc JOIN documents d ON d.id = dc.document_id WHERE dc.project_id = ? ORDER BY dc.chunk_index LIMIT 80').bind(project_id);

      const chunks = await stmt.all<{ content: string }>();
      const text = chunks.results.map((c) => c.content).join('\n\n');

      const client = new AnthropicClient(env.ANTHROPIC_API_KEY);
      const prompt = `Analyze this RFP document and create a comprehensive compliance matrix. 
Extract every requirement, instruction (Section L), and evaluation factor (Section M).
For each item extract: requirement text, requirement_ref, section, instruction, evaluation_factor, priority.

Document:
${text.substring(0, 8000)}

Return a JSON array of compliance matrix items.`;

      const response = await client.generateText(prompt, undefined, 2048);
      let items: Partial<ComplianceItem>[] = [];

      try {
        const match = response.match(/\[[\s\S]*\]/);
        if (match) items = JSON.parse(match[0]);
      } catch {
        items = [];
      }

      const saved = [];
      for (const item of items) {
        const id = generateId('cm');
        await env.DB.prepare(`
          INSERT INTO compliance_matrix (id, project_id, requirement, requirement_ref, section, instruction, evaluation_factor, priority, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `).bind(id, project_id, item.requirement ?? '', item.requirement_ref ?? null, item.section ?? null, item.instruction ?? null, item.evaluation_factor ?? null, item.priority ?? 'medium').run();
        saved.push({ id, ...item });
      }

      return { result: { created: saved.length, matrix: saved } };
    }

    case 'generate_proposal_outline': {
      const { project_id, volume, page_limit } = input as {
        project_id: string; volume?: string; page_limit?: number;
      };

      const ragCtx = await executeRAG('proposal requirements evaluation criteria instructions', env, {
        project_id,
        top_k: 10,
      });

      const client = new AnthropicClient(env.ANTHROPIC_API_KEY);
      const prompt = `Create a detailed ${volume || 'full proposal'} outline for this project.
${page_limit ? `Total page limit: ${page_limit} pages` : ''}

Requirements from knowledge base:
${ragCtx.context_text || 'No specific RFP found — generate a standard proposal outline'}

Create a detailed section-by-section outline with:
- Section number and title
- Page allocation
- Key content to include
- Win themes to highlight
- Evidence/proof points needed

Format as a structured markdown outline.`;

      const outline = await client.generateText(prompt, SYSTEM_PROMPTS.proposal, 3000);
      return { result: { outline, citations: ragCtx.citations } };
    }

    case 'generate_executive_summary': {
      const { project_id, word_limit = 500, focus } = input as {
        project_id: string; word_limit?: number; focus?: string;
      };

      const ragCtx = await executeRAG('company capabilities win themes discriminators value proposition', env, {
        project_id,
        top_k: 8,
      });

      const client = new AnthropicClient(env.ANTHROPIC_API_KEY);
      const prompt = `Write a compelling executive summary for this proposal (${word_limit} words max).
${focus ? `Key focus: ${focus}` : ''}

Context from knowledge base:
${ragCtx.context_text || 'Draw on general proposal best practices'}

The executive summary must:
1. Hook the evaluator in the first sentence
2. State our key discriminating capabilities
3. Address the customer's hot buttons
4. Preview our approach/solution
5. Close with a strong value proposition

Stay under ${word_limit} words. Write for proposal evaluators.`;

      const summary = await client.generateText(prompt, SYSTEM_PROMPTS.proposal, word_limit * 8);
      return {
        result: {
          executive_summary: summary,
          word_count: summary.split(/\s+/).length,
          citations: ragCtx.citations,
        },
      };
    }

    case 'save_to_brain': {
      const { type, title, content, tags, project_id: pid } = input as {
        type: string; title: string; content: string; tags?: string[]; project_id?: string;
      };

      const id = generateId('brain');
      await env.DB.prepare(`
        INSERT INTO brain_entries (id, project_id, type, title, content, tags, source)
        VALUES (?, ?, ?, ?, ?, ?, 'agent')
      `).bind(id, pid ?? projectId ?? null, type, title, content, JSON.stringify(tags ?? [])).run();

      return { result: { saved: true, id, title } };
    }

    case 'get_brain_knowledge': {
      const { query, type, project_id: pid } = input as {
        query: string; type?: string; project_id?: string;
      };

      let sql = 'SELECT * FROM brain_entries WHERE 1=1';
      const params: unknown[] = [];

      if (type) { sql += ' AND type = ?'; params.push(type); }
      if (pid) { sql += ' AND project_id = ?'; params.push(pid); }

      sql += ' ORDER BY updated_at DESC LIMIT 20';
      const entries = await env.DB.prepare(sql).bind(...params).all();

      // Filter by query relevance (simple keyword match as fallback)
      const filtered = entries.results.filter((e: unknown) => {
        const entry = e as { title: string; content: string };
        const q = query.toLowerCase();
        return entry.title.toLowerCase().includes(q) || entry.content.toLowerCase().includes(q);
      });

      return { result: { entries: filtered, count: filtered.length } };
    }

    case 'update_qa_answer': {
      const { qa_id, answer, status = 'answered' } = input as {
        qa_id: string; answer: string; status?: string;
      };
      await env.DB.prepare('UPDATE qa_pairs SET answer = ?, status = ?, updated_at = ? WHERE id = ?')
        .bind(answer, status, now(), qa_id)
        .run();
      return { result: { updated: true, qa_id, status } };
    }

    case 'update_compliance_status': {
      const { compliance_id, status, response_section, evidence, gap } = input as {
        compliance_id: string; status: string;
        response_section?: string; evidence?: string; gap?: string;
      };
      await env.DB.prepare(`
        UPDATE compliance_matrix SET status = ?, response_section = ?, evidence = ?, gap = ?, updated_at = ?
        WHERE id = ?
      `).bind(status, response_section ?? null, evidence ?? null, gap ?? null, now(), compliance_id).run();
      return { result: { updated: true, compliance_id, status } };
    }

    case 'create_document_draft': {
      // This requires human approval since it creates a file
      const { project_id: pid, title, content, document_type } = input as {
        project_id: string; title: string; content: string; document_type?: string;
      };

      const taskId = generateId('task');
      const task: AgentTask = {
        id: taskId,
        conversation_id: conversationId,
        project_id: pid,
        task_type: 'create_document_draft',
        title: `Create document: ${title}`,
        description: `Create a new ${document_type || 'document'} draft titled "${title}" with ${content.split(/\s+/).length} words`,
        status: 'pending',
        requires_approval: true,
        input: { project_id: pid, title, content, document_type },
        created_at: now(),
        updated_at: now(),
      };

      await env.DB.prepare(`
        INSERT INTO agent_tasks (id, conversation_id, project_id, task_type, title, description, status, requires_approval, input)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', 1, ?)
      `).bind(taskId, conversationId, pid, task.task_type, task.title, task.description, JSON.stringify(task.input)).run();

      return { result: { task_id: taskId, status: 'awaiting_approval' }, requires_approval: true, task };
    }

    default:
      return { result: { error: `Unknown tool: ${toolName}` } };
  }
}

// ──────────────────────────────────────────
// Main Agent Loop (streaming)
// ──────────────────────────────────────────

export async function runAgent(
  userMessage: string,
  conversationHistory: ClaudeMessage[],
  env: Env,
  conversationId: string,
  projectId: string | undefined,
  mode: string = 'general',
  onStream: StreamCallback,
): Promise<Message> {
  const client = new AnthropicClient(env.ANTHROPIC_API_KEY);
  const messageId = generateId('msg');
  const systemPrompt = SYSTEM_PROMPTS[mode as keyof typeof SYSTEM_PROMPTS] ?? SYSTEM_PROMPTS.general;

  // Build message history including the new user message
  const messages: ClaudeMessage[] = [
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  let fullResponse = '';
  const allCitations: Citation[] = [];
  const toolCalls: ToolCall[] = [];

  // Agentic loop — continues until model stops using tools
  for (let iteration = 0; iteration < 10; iteration++) {
    let currentToolUseId = '';
    let currentToolName = '';
    let currentToolInput = '';
    let isInToolUse = false;

    // Stream from Claude
    const stream = client.stream({
      system: systemPrompt + (projectId ? `\n\nCurrent project context: ${projectId}` : ''),
      messages,
      tools: AGENT_TOOLS,
      max_tokens: 4096,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        const block = event.content_block as { type: string; id?: string; name?: string };
        if (block.type === 'tool_use') {
          isInToolUse = true;
          currentToolUseId = block.id ?? '';
          currentToolName = block.name ?? '';
          currentToolInput = '';

          const tc: ToolCall = {
            id: currentToolUseId,
            name: currentToolName as never,
            input: {},
            status: 'running',
          };
          toolCalls.push(tc);
          await onStream({ type: 'tool_start', tool: tc });
        } else if (block.type === 'text') {
          isInToolUse = false;
        }
      }

      if (event.type === 'content_block_delta') {
        const delta = event.delta;
        if (!delta) continue;

        if (delta.type === 'text_delta' && delta.text) {
          fullResponse += delta.text;
          await onStream({ type: 'chunk', content: delta.text, message_id: messageId });
        } else if (delta.type === 'input_json_delta' && delta.partial_json) {
          currentToolInput += delta.partial_json;
        }
      }

      if (event.type === 'content_block_stop' && isInToolUse) {
        // Execute the tool
        let toolInput: Record<string, unknown> = {};
        try {
          toolInput = JSON.parse(currentToolInput);
        } catch {
          toolInput = {};
        }

        // Update tool call with parsed input
        const tc = toolCalls.find((t) => t.id === currentToolUseId);
        if (tc) tc.input = toolInput;

        // Execute
        const { result, requires_approval, task } = await executeTool(
          currentToolName,
          toolInput,
          env,
          conversationId,
          projectId
        );

        // Update tool call status
        if (tc) {
          tc.output = result;
          tc.status = requires_approval ? 'awaiting_approval' : 'completed';
        }

        if (requires_approval && task) {
          await onStream({ type: 'approval_required', task });
          // Inject approval-pending message and break
          messages.push({
            role: 'assistant',
            content: [{
              type: 'tool_use' as const,
              id: currentToolUseId,
              name: currentToolName,
              input: toolInput,
            }],
          });
          messages.push({
            role: 'user',
            content: [{
              type: 'tool_result' as const,
              tool_use_id: currentToolUseId,
              content: JSON.stringify({ status: 'awaiting_approval', task_id: task.id }),
            }],
          });

          fullResponse += `\n\n⏳ **Awaiting your approval** to ${task.description}. Please approve or reject above.`;
          break;
        }

        // Collect citations from search results
        if (currentToolName === 'search_knowledge_base' || currentToolName === 'answer_proposal_question') {
          const resultObj = result as { citations?: Citation[] };
          if (resultObj.citations) {
            allCitations.push(...resultObj.citations);
            await onStream({ type: 'citations', citations: resultObj.citations });
          }
        }

        await onStream({ type: 'tool_complete', tool_id: currentToolUseId, result });

        // Add tool result to message history for next iteration
        messages.push({
          role: 'assistant',
          content: [{
            type: 'tool_use' as const,
            id: currentToolUseId,
            name: currentToolName,
            input: toolInput,
          }],
        });
        messages.push({
          role: 'user',
          content: [{
            type: 'tool_result' as const,
            tool_use_id: currentToolUseId,
            content: JSON.stringify(result),
          }],
        });

        isInToolUse = false;
      }

      // If model is done, break the outer loop
      if (event.type === 'message_delta') {
        const stopReason = event.delta?.type;
        if ((event.message as { stop_reason?: string })?.stop_reason === 'end_turn') {
          break;
        }
      }
    }

    // If no tool use in this iteration, we're done
    if (!isInToolUse && !toolCalls.some((t) => t.status === 'running')) {
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
    metadata: { model: 'claude-sonnet-4-20250514' },
    created_at: now(),
  };

  await onStream({ type: 'message_complete', message: finalMessage });
  return finalMessage;
}
