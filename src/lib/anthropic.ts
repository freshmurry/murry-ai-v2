// ================================================================
// MurryAI - Anthropic Claude API Client
// Thin wrapper optimized for Cloudflare Workers (no Node.js SDK)
// ================================================================

import type { AgentTool, Citation } from '../types';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | ClaudeContentBlock[];
}

export type ClaudeContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string };

export interface ClaudeStreamEvent {
  type: string;
  index?: number;
  delta?: { type: string; text?: string; partial_json?: string };
  content_block?: { type: string; id?: string; name?: string; input?: unknown; text?: string };
  message?: { stop_reason?: string; usage?: { input_tokens: number; output_tokens: number } };
}

export interface AnthropicRequestOptions {
  model?: string;
  max_tokens?: number;
  system?: string;
  messages: ClaudeMessage[];
  tools?: AgentTool[];
  stream?: boolean;
  temperature?: number;
}

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const API_BASE = 'https://api.anthropic.com/v1';

export class AnthropicClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /** Non-streaming completion */
  async complete(opts: AnthropicRequestOptions): Promise<{
    content: ClaudeContentBlock[];
    stop_reason: string;
    usage: { input_tokens: number; output_tokens: number };
  }> {
    const response = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        model: opts.model ?? DEFAULT_MODEL,
        max_tokens: opts.max_tokens ?? 4096,
        temperature: opts.temperature ?? 0.3,
        system: opts.system,
        messages: opts.messages,
        tools: opts.tools?.map(this.formatTool),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${err}`);
    }

    return response.json();
  }

  /** Streaming completion — yields raw SSE events */
  async *stream(opts: AnthropicRequestOptions): AsyncGenerator<ClaudeStreamEvent> {
    const response = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        model: opts.model ?? DEFAULT_MODEL,
        max_tokens: opts.max_tokens ?? 4096,
        temperature: opts.temperature ?? 0.3,
        system: opts.system,
        messages: opts.messages,
        tools: opts.tools?.map(this.formatTool),
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic stream error ${response.status}: ${err}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') return;
          try {
            yield JSON.parse(data) as ClaudeStreamEvent;
          } catch {
            // Ignore malformed lines
          }
        }
      }
    }
  }

  /** Simple one-shot text generation */
  async generateText(
    prompt: string,
    systemPrompt?: string,
    maxTokens = 2048
  ): Promise<string> {
    const result = await this.complete({
      messages: [{ role: 'user', content: prompt }],
      system: systemPrompt,
      max_tokens: maxTokens,
    });
    const textBlock = result.content.find((b) => b.type === 'text');
    return textBlock && 'text' in textBlock ? textBlock.text : '';
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
    };
  }

  private formatTool(tool: AgentTool) {
    return {
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema,
    };
  }
}

/** Build a formatted citation block for inclusion in prompts */
export function formatCitationsForPrompt(citations: Citation[]): string {
  if (citations.length === 0) return '';
  return citations
    .map((c, i) =>
      `[${i + 1}] From "${c.document_name}"${c.section_path ? ` — ${c.section_path}` : ''}${c.page_number ? ` (p.${c.page_number})` : ''}:\n${c.content}`
    )
    .join('\n\n');
}
