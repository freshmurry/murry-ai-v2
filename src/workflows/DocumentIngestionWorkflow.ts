// ================================================================
// MurryAI - Document Ingestion Workflow
// Background pipeline: upload → extract → chunk → embed → index
// ================================================================

import type { Env, DocumentIngestionParams, DocumentFileType } from '../types';
import { generateId, now } from '../types';
import { extractTextFromBuffer, chunkDocument } from '../lib/chunker';
import { generateEmbedding, indexChunk } from '../lib/rag';

// Cloudflare Workflow types
interface WorkflowEvent<T> {
  payload: T;
}

interface WorkflowStep {
  do<T>(name: string, fn: () => Promise<T>): Promise<T>;
  sleep(name: string, duration: string): Promise<void>;
}

export class DocumentIngestionWorkflow {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async run(event: WorkflowEvent<DocumentIngestionParams>, step: WorkflowStep): Promise<unknown> {
    const { document_id, project_id, r2_key, file_type, document_name } = event.payload;

    // ── Step 1: Update status to processing ──
    await step.do('mark-processing', async () => {
      await this.env.DB.prepare(`
        UPDATE documents SET status = 'processing', updated_at = ? WHERE id = ?
      `).bind(now(), document_id).run();

      await this.logStep(document_id, 'processing', 'Document marked as processing');
    });

    // ── Step 2: Fetch raw file from R2 ──
    const rawBytes = await step.do('fetch-from-r2', async () => {
      const object = await this.env.DOCUMENTS_BUCKET.get(r2_key);
      if (!object) throw new Error(`Document not found in R2: ${r2_key}`);
      return await object.arrayBuffer();
    });

    // ── Step 3: Extract text ──
    const { text, method, pageCount } = await step.do('extract-text', async () => {
      let extractedText = '';
      let extractionMethod = 'text';
      let pages = 1;

      const imageTypes = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
      const ft = file_type as DocumentFileType;

      if (imageTypes.includes(ft)) {
        // Use Workers AI vision for image content
        extractedText = await this.extractImageContent(rawBytes, ft);
        extractionMethod = 'vision';
      } else {
        extractedText = await extractTextFromBuffer(rawBytes, ft);
        extractionMethod = 'text';

        // Estimate page count (250 words per page average)
        const wordCount = extractedText.split(/\s+/).length;
        pages = Math.max(1, Math.ceil(wordCount / 250));
      }

      if (!extractedText || extractedText.trim().length < 50) {
        throw new Error(`Failed to extract meaningful text from ${document_name}. Extracted: "${extractedText.substring(0, 100)}"`);
      }

      await this.logStep(document_id, 'extracted', `Extracted ${extractedText.length} chars via ${extractionMethod}`);
      return { text: extractedText, method: extractionMethod, pageCount: pages };
    });

    // ── Step 4: Chunk the document ──
    const chunks = await step.do('chunk-document', async () => {
      const chunkResults = chunkDocument(text, file_type, { maxTokens: 400 });

      await this.logStep(document_id, 'chunked', `Created ${chunkResults.length} chunks`);
      return chunkResults;
    });

    // ── Step 5: Delete old chunks if re-indexing ──
    await step.do('clear-old-chunks', async () => {
      const oldChunks = await this.env.DB.prepare(
        'SELECT vector_id FROM document_chunks WHERE document_id = ? AND vector_id IS NOT NULL'
      ).bind(document_id).all<{ vector_id: string }>();

      if (oldChunks.results.length > 0) {
        const vectorIds = oldChunks.results.map((c) => c.vector_id);
        await this.env.VECTORIZE.deleteByIds(vectorIds);
      }

      await this.env.DB.prepare('DELETE FROM document_chunks WHERE document_id = ?')
        .bind(document_id)
        .run();
    });

    // ── Step 6: Generate embeddings and store in batches ──
    const BATCH_SIZE = 5; // Embed 5 chunks at a time to avoid timeouts
    let processedChunks = 0;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);

      await step.do(`embed-batch-${Math.floor(i / BATCH_SIZE)}`, async () => {
        await Promise.all(
          batch.map(async (chunk) => {
            const chunkId = generateId('chunk');
            const vectorId = `v_${chunkId}`;

            // Generate embedding
            let embedding: number[];
            try {
              embedding = await generateEmbedding(chunk.content, this.env);
            } catch {
              // If embedding fails, store chunk without vector
              await this.env.DB.prepare(`
                INSERT INTO document_chunks (id, document_id, project_id, content, chunk_index, chunk_type, token_count, section_path)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(chunkId, document_id, project_id, chunk.content, chunk.chunk_index, chunk.chunk_type, chunk.token_count, chunk.section_path ?? null).run();
              return;
            }

            // Store in Vectorize
            await indexChunk(vectorId, embedding, {
              chunk_id: chunkId,
              document_id,
              project_id,
              chunk_type: chunk.chunk_type,
              section_path: chunk.section_path,
              page_number: chunk.page_number ?? 1,
            }, this.env);

            // Store chunk metadata in D1
            await this.env.DB.prepare(`
              INSERT INTO document_chunks (id, document_id, project_id, content, chunk_index, chunk_type, vector_id, token_count, page_number, section_path)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
              chunkId, document_id, project_id,
              chunk.content, chunk.chunk_index, chunk.chunk_type,
              vectorId, chunk.token_count, chunk.page_number ?? null,
              chunk.section_path ?? null
            ).run();

            processedChunks++;
          })
        );

        // Update progress
        const progress = Math.min(95, Math.round(((i + batch.length) / chunks.length) * 90));
        await this.env.DB.prepare('UPDATE workflow_runs SET progress = ? WHERE document_id = ?')
          .bind(progress, document_id)
          .run();
      });
    }

    // ── Step 7: Finalize document metadata ──
    await step.do('finalize', async () => {
      const wordCount = text.split(/\s+/).filter(Boolean).length;

      await this.env.DB.prepare(`
        UPDATE documents
        SET status = 'indexed',
            extraction_method = ?,
            word_count = ?,
            page_count = ?,
            updated_at = ?
        WHERE id = ?
      `).bind(method, wordCount, pageCount, now(), document_id).run();

      await this.env.DB.prepare(`
        UPDATE workflow_runs
        SET status = 'completed', progress = 100,
            result = ?, completed_at = ?
        WHERE document_id = ?
      `).bind(
        JSON.stringify({
          chunks_created: processedChunks,
          word_count: wordCount,
          page_count: pageCount,
          extraction_method: method,
        }),
        now(),
        document_id
      ).run();

      await this.logStep(document_id, 'completed', `Indexed ${processedChunks} chunks, ${wordCount} words`);
    });

    return {
      success: true,
      document_id,
      chunks_created: processedChunks,
      message: `Successfully indexed "${document_name}"`,
    };
  }

  // ──────────────────────────────────────────
  // Image/OCR via Workers AI Vision
  // ──────────────────────────────────────────

  private async extractImageContent(buffer: ArrayBuffer, fileType: string): Promise<string> {
    const uint8 = new Uint8Array(buffer);

    try {
      const result = await this.env.AI.run('@cf/llava-hf/llava-1.5-7b-hf' as never, {
        image: Array.from(uint8),
        prompt: 'Please carefully read and transcribe all text visible in this image. Include headings, body text, captions, labels, and any other textual content. Preserve the reading order. After transcription, briefly describe the visual content.',
        max_tokens: 2048,
      } as never) as { description?: string; response?: string };

      return result.description ?? result.response ?? 'Image content could not be extracted';
    } catch {
      // Fallback: try OCR-focused prompt with a simpler model
      return `[Image file: ${fileType}] - Content extraction requires OCR processing`;
    }
  }

  private async logStep(documentId: string, status: string, message: string): Promise<void> {
    try {
      const run = await this.env.DB.prepare(
        'SELECT steps_log FROM workflow_runs WHERE document_id = ?'
      ).bind(documentId).first<{ steps_log: string | null }>();

      const existingLog: unknown[] = run?.steps_log ? JSON.parse(run.steps_log) : [];
      existingLog.push({ step: status, status: 'completed', result: message, ts: now() });

      await this.env.DB.prepare(
        'UPDATE workflow_runs SET steps_log = ? WHERE document_id = ?'
      ).bind(JSON.stringify(existingLog), documentId).run();
    } catch {
      // Non-critical logging failure
    }
  }
}
