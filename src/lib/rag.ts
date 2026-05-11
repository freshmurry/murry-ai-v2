// ================================================================
// MurryAI - RAG Pipeline
// Retrieval-Augmented Generation: embed → search → rerank → generate
// ================================================================

import type { Env, Citation, SearchResult, RAGContext, DocumentChunk } from '../types';
import { AnthropicClient } from './anthropic';

// ──────────────────────────────────────────
// Embedding
// ──────────────────────────────────────────

/** Generate embeddings using Cloudflare Workers AI */
export async function generateEmbedding(
  text: string,
  env: Env
): Promise<number[]> {
  const result = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
    text: [text.substring(0, 2048)], // Model has input limit
  });

  const raw = (result as any).data ?? (result as any).output;
  const embedding = Array.isArray(raw)
    ? (Array.isArray(raw[0]) ? raw[0] as number[] : raw as number[])
    : undefined;
  if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
    throw new Error('Failed to generate embedding');
  }

  return embedding as number[];
}

/** Generate embeddings for multiple texts in parallel */
export async function generateEmbeddingsBatch(
  texts: string[],
  env: Env,
  batchSize = 10
): Promise<number[][]> {
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((text) => generateEmbedding(text, env))
    );
    results.push(...batchResults);
  }

  return results;
}

// ──────────────────────────────────────────
// Indexing
// ──────────────────────────────────────────

export interface VectorMetadata {
  chunk_id: string;
  document_id: string;
  project_id: string;
  chunk_type: string;
  section_path?: string;
  page_number?: number;
}

/** Store a chunk's embedding in Vectorize */
export async function indexChunk(
  vectorId: string,
  embedding: number[],
  metadata: VectorMetadata,
  env: Env
): Promise<void> {
  await env.VECTOR_INDEX.upsert([
    {
      id: vectorId,
      values: embedding,
      metadata: metadata as unknown as Record<string, string | number | boolean>,
    },
  ]);
}

/** Remove all vectors for a document */
export async function deleteDocumentVectors(
  chunkIds: string[],
  env: Env
): Promise<void> {
  if (chunkIds.length === 0) return;
  // Vectorize deleteByIds in batches of 100
  for (let i = 0; i < chunkIds.length; i += 100) {
    await env.VECTOR_INDEX.deleteByIds(chunkIds.slice(i, i + 100));
  }
}

// ──────────────────────────────────────────
// Search
// ──────────────────────────────────────────

export interface SearchOptions {
  project_id?: string;
  document_ids?: string[];
  top_k?: number;
  score_threshold?: number;
  chunk_types?: string[];
}

/** Semantic search over Vectorize */
export async function semanticSearch(
  query: string,
  env: Env,
  options: SearchOptions = {}
): Promise<Array<{ vector_id: string; score: number; metadata: VectorMetadata }>> {
  const embedding = await generateEmbedding(query, env);

  const filter: Record<string, unknown> = {};
  if (options.project_id) filter['project_id'] = options.project_id;

  const result = await env.VECTOR_INDEX.query(embedding, {
    topK: options.top_k ?? 20,
    filter: Object.keys(filter).length > 0 ? (filter as unknown as VectorizeVectorMetadataFilter) : undefined,
    returnMetadata: 'all',
  });

  return (result.matches ?? [])
    .filter((m) => m.score >= (options.score_threshold ?? 0.3))
    .map((m) => ({
      vector_id: m.id,
      score: m.score,
      metadata: m.metadata as unknown as VectorMetadata,
    }));
}

// ──────────────────────────────────────────
// Reranking
// ──────────────────────────────────────────

/** LLM-based reranking for better precision */
export async function rerankResults(
  query: string,
  candidates: SearchResult[],
  client: AnthropicClient,
  topN = 5
): Promise<SearchResult[]> {
  if (candidates.length <= topN) return candidates;

  const prompt = `You are a relevance ranking system. Given a query and a list of text chunks, 
rank them by how relevant they are to the query.

Query: "${query}"

Chunks (numbered 1 to ${candidates.length}):
${candidates.map((c, i) => `[${i + 1}] ${c.chunk.content.substring(0, 300)}`).join('\n\n')}

Return ONLY a JSON array of the chunk numbers in order from most to least relevant, 
selecting the top ${topN} most relevant chunks. Example: [3, 1, 5, 2, 4]`;

  try {
    const response = await client.generateText(prompt, undefined, 256);
    const match = response.match(/\[[\d,\s]+\]/);
    if (!match) return candidates.slice(0, topN);

    const ranking: number[] = JSON.parse(match[0]);
    return ranking
      .slice(0, topN)
      .filter((i) => i >= 1 && i <= candidates.length)
      .map((i) => candidates[i - 1])
      .filter(Boolean);
  } catch {
    return candidates.slice(0, topN);
  }
}

// ──────────────────────────────────────────
// Full RAG Pipeline
// ──────────────────────────────────────────

/** Execute full RAG: search + fetch chunks + rerank + build context */
export async function executeRAG(
  query: string,
  env: Env,
  options: SearchOptions & { rerank?: boolean; maxContextTokens?: number } = {}
): Promise<RAGContext> {
  const maxTokens = options.maxContextTokens ?? 6000;

  // 1. Semantic search
  const searchMatches = await semanticSearch(query, env, {
    ...options,
    top_k: options.rerank ? 20 : 8,
  });

  if (searchMatches.length === 0) {
    return { context_text: '', citations: [], total_chunks: 0, tokens_used: 0 };
  }

  // 2. Fetch chunk details from D1
  const chunkIds = searchMatches.map((m) => m.metadata.chunk_id);
  const placeholders = chunkIds.map(() => '?').join(',');

  const chunksResult = await env.DB.prepare(
    `SELECT dc.*, d.name as doc_name, d.original_filename
     FROM document_chunks dc
     JOIN documents d ON d.id = dc.document_id
     WHERE dc.id IN (${placeholders})`
  )
    .bind(...chunkIds)
    .all<DocumentChunk & { doc_name: string; original_filename: string }>();

  const chunkMap = new Map(chunksResult.results.map((c) => [c.id, c]));

  // 3. Build SearchResult array with scores
  let results: SearchResult[] = searchMatches
    .map((m) => {
      const chunk = chunkMap.get(m.metadata.chunk_id);
      if (!chunk) return null;
      return {
        chunk: chunk as unknown as DocumentChunk,
        document: { id: m.metadata.document_id, name: chunk.doc_name } as never,
        score: m.score,
      };
    })
    .filter(Boolean) as SearchResult[];

  // 4. Optional LLM reranking
  if (options.rerank && env.ANTHROPIC_API_KEY) {
    const client = new AnthropicClient(env.ANTHROPIC_API_KEY);
    results = await rerankResults(query, results, client, 6);
  } else {
    results = results.slice(0, 8);
  }

  // 5. Build context within token budget
  let totalTokens = 0;
  const citations: Citation[] = [];
  const contextParts: string[] = [];

  for (const result of results) {
    const chunk = result.chunk as unknown as DocumentChunk & {
      doc_name: string;
      section_path?: string;
    };
    const tokenEstimate = Math.ceil(chunk.content.length / 4);

    if (totalTokens + tokenEstimate > maxTokens) break;

    totalTokens += tokenEstimate;

    const citation: Citation = {
      document_id: chunk.document_id,
      document_name: chunk.doc_name || 'Unknown Document',
      chunk_id: chunk.id,
      content: chunk.content,
      relevance_score: result.score,
      page_number: chunk.page_number,
      section_path: chunk.section_path,
      project_id: chunk.project_id,
    };

    citations.push(citation);
    contextParts.push(
      `[Source: "${citation.document_name}"${citation.section_path ? ` — ${citation.section_path}` : ''}]\n${chunk.content}`
    );
  }

  return {
    context_text: contextParts.join('\n\n---\n\n'),
    citations,
    total_chunks: results.length,
    tokens_used: totalTokens,
  };
}

// ──────────────────────────────────────────
// System prompts for different agent modes
// ──────────────────────────────────────────

export const SYSTEM_PROMPTS = {
  general: `You are MurryAI, a highly capable personal AI assistant specializing in proposal development, 
document analysis, and knowledge management. You have access to a rich knowledge base of documents 
and can search through them to answer questions, generate content, and provide analysis.

When answering questions:
- Always cite your sources from the knowledge base
- Be specific and actionable in your responses
- Ask clarifying questions when the intent is ambiguous
- Offer to perform follow-up actions (save to brain, create drafts, etc.)

Your personality: professional, precise, proactive, and deeply knowledgeable about proposal work.`,

  proposal: `You are MurryAI in Proposal Mode — a specialized AI assistant for government and commercial 
proposal development. You are an expert in:
- FAR/DFARS compliance requirements
- Section L (instructions) and Section M (evaluation criteria) analysis
- Proposal writing best practices (Shipley method)
- Win themes, discriminators, and value propositions
- Compliance matrix development
- Technical volume, management volume, and past performance writing

Always structure your responses for proposal professionals. Use proper section references,
provide compliance-focused analysis, and highlight win themes in your suggestions.`,

  research: `You are MurryAI in Research Mode — a deep-analysis assistant focused on synthesizing
information from multiple documents to answer complex questions with comprehensive, well-cited responses.
Organize information clearly, identify patterns and contradictions across sources, and always trace
claims back to specific document sections.`,

  qa: `You are MurryAI in Q&A Response Mode — an expert proposal writer focused on crafting compelling
answers to proposal evaluation questions. For each question:
1. Identify what the evaluator is really looking for
2. Structure the response to maximize evaluation scores
3. Lead with your discriminating capabilities
4. Support with concrete evidence and past performance
5. Stay within any word/page limits specified
6. Use active voice and compliance language`,
};
