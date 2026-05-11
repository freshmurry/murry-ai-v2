// ================================================================
// MurryAI - Document Chunking Engine
// Splits documents into optimal chunks for RAG
// ================================================================

export interface ChunkResult {
  content: string;
  chunk_index: number;
  chunk_type: 'text' | 'table' | 'header' | 'list' | 'code';
  token_count: number;
  page_number?: number;
  section_path?: string;
  metadata?: Record<string, unknown>;
}

const MAX_CHUNK_TOKENS = 400;   // ~300 words
const MIN_CHUNK_TOKENS = 50;    // ~40 words
const OVERLAP_TOKENS = 50;      // context overlap between chunks

/** Rough token estimator (4 chars ≈ 1 token) */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Main entry point: chunk any text content */
export function chunkDocument(
  text: string,
  fileType: string,
  options: { maxTokens?: number; overlap?: boolean } = {}
): ChunkResult[] {
  const maxTokens = options.maxTokens ?? MAX_CHUNK_TOKENS;

  // Pre-process based on file type
  const cleaned = preprocess(text, fileType);

  // Split into semantic sections first
  const sections = splitIntoSections(cleaned);

  // Then chunk each section
  const chunks: ChunkResult[] = [];
  let chunkIndex = 0;
  let currentSection = '';

  for (const section of sections) {
    if (section.type === 'table') {
      // Tables stay as single chunks
      chunks.push({
        content: section.content.trim(),
        chunk_index: chunkIndex++,
        chunk_type: 'table',
        token_count: estimateTokens(section.content),
        section_path: section.sectionPath,
      });
      continue;
    }

    if (section.type === 'code') {
      chunks.push({
        content: section.content.trim(),
        chunk_index: chunkIndex++,
        chunk_type: 'code',
        token_count: estimateTokens(section.content),
        section_path: section.sectionPath,
      });
      continue;
    }

    if (section.type === 'header') {
      currentSection = section.content;
    }

    // Split section text into paragraph-aware chunks
    const sectionChunks = splitSectionIntoChunks(
      section.content,
      maxTokens,
      currentSection,
      chunkIndex
    );
    for (const c of sectionChunks) {
      chunks.push({
        ...c,
        chunk_index: chunkIndex++,
        chunk_type: section.type === 'list' ? 'list' : 'text',
        section_path: section.sectionPath ?? currentSection,
      });
    }
  }

  // Post-process: remove empty, merge tiny chunks
  return postprocess(chunks, MIN_CHUNK_TOKENS);
}

// ──────────────────────────────────────────
// Preprocessing
// ──────────────────────────────────────────

function preprocess(text: string, fileType: string): string {
  let cleaned = text;

  // Normalize line endings
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Remove excessive whitespace while preserving structure
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');

  // HTML-specific: strip tags but preserve structure hints
  if (['html', 'htm'].includes(fileType)) {
    cleaned = stripHtmlTags(cleaned);
  }

  // Markdown-specific: clean up some MD artifacts
  if (['md', 'mdx'].includes(fileType)) {
    cleaned = cleaned.replace(/^---[\s\S]*?---\n/, ''); // Remove frontmatter
  }

  return cleaned.trim();
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '');
}

// ──────────────────────────────────────────
// Section splitting
// ──────────────────────────────────────────

interface Section {
  type: 'text' | 'table' | 'header' | 'list' | 'code';
  content: string;
  sectionPath?: string;
}

function splitIntoSections(text: string): Section[] {
  const sections: Section[] = [];
  const lines = text.split('\n');

  let currentBuffer: string[] = [];
  let currentType: Section['type'] = 'text';
  let inTable = false;
  let inCode = false;
  let sectionPath = '';

  const flush = () => {
    const content = currentBuffer.join('\n').trim();
    if (content) {
      sections.push({ type: currentType, content, sectionPath });
    }
    currentBuffer = [];
  };

  for (const line of lines) {
    // Code blocks
    if (line.startsWith('```') || line.startsWith('~~~')) {
      if (inCode) {
        currentBuffer.push(line);
        flush();
        inCode = false;
        currentType = 'text';
      } else {
        flush();
        inCode = true;
        currentType = 'code';
        currentBuffer.push(line);
      }
      continue;
    }

    if (inCode) {
      currentBuffer.push(line);
      continue;
    }

    // Markdown-style tables
    if (line.includes('|') && line.trim().startsWith('|')) {
      if (!inTable) {
        flush();
        inTable = true;
        currentType = 'table';
      }
      currentBuffer.push(line);
      continue;
    } else if (inTable) {
      flush();
      inTable = false;
      currentType = 'text';
    }

    // Markdown headers
    const headerMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headerMatch) {
      flush();
      const level = headerMatch[1].length;
      const title = headerMatch[2];

      // Build section path
      const pathParts = sectionPath ? sectionPath.split(' > ') : [];
      pathParts.splice(level - 1);
      pathParts.push(title);
      sectionPath = pathParts.join(' > ');

      sections.push({ type: 'header', content: title, sectionPath });
      currentType = 'text';
      continue;
    }

    // List items
    if (line.match(/^[\s]*[-*+•]\s/) || line.match(/^[\s]*\d+[.)]\s/)) {
      if (currentType !== 'list') {
        flush();
        currentType = 'list';
      }
      currentBuffer.push(line);
      continue;
    } else if (currentType === 'list' && line.trim() === '') {
      flush();
      currentType = 'text';
      continue;
    }

    currentBuffer.push(line);
  }

  flush();
  return sections;
}

// ──────────────────────────────────────────
// Chunk splitting within a section
// ──────────────────────────────────────────

function splitSectionIntoChunks(
  text: string,
  maxTokens: number,
  sectionPath: string,
  startIndex: number
): Omit<ChunkResult, 'chunk_type' | 'chunk_index' | 'section_path'>[] {
  const chunks: Omit<ChunkResult, 'chunk_type' | 'chunk_index' | 'section_path'>[] = [];

  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/);
  let currentBuffer = '';

  for (const paragraph of paragraphs) {
    const combined = currentBuffer ? `${currentBuffer}\n\n${paragraph}` : paragraph;
    const tokens = estimateTokens(combined);

    if (tokens > maxTokens && currentBuffer) {
      // Flush current buffer
      chunks.push({
        content: currentBuffer.trim(),
        token_count: estimateTokens(currentBuffer),
      });

      // Check if this paragraph itself needs further splitting
      if (estimateTokens(paragraph) > maxTokens) {
        const subChunks = splitBysentences(paragraph, maxTokens);
        chunks.push(...subChunks);
        currentBuffer = '';
      } else {
        currentBuffer = paragraph;
      }
    } else if (estimateTokens(paragraph) > maxTokens) {
      // Paragraph is huge — split by sentences
      if (currentBuffer) {
        chunks.push({ content: currentBuffer.trim(), token_count: estimateTokens(currentBuffer) });
        currentBuffer = '';
      }
      const subChunks = splitBysentences(paragraph, maxTokens);
      chunks.push(...subChunks);
    } else {
      currentBuffer = combined;
    }
  }

  if (currentBuffer.trim()) {
    chunks.push({
      content: currentBuffer.trim(),
      token_count: estimateTokens(currentBuffer),
    });
  }

  return chunks;
}

function splitBysentences(
  text: string,
  maxTokens: number
): Omit<ChunkResult, 'chunk_type' | 'chunk_index' | 'section_path'>[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  const chunks: Omit<ChunkResult, 'chunk_type' | 'chunk_index' | 'section_path'>[] = [];
  let buffer = '';

  for (const sentence of sentences) {
    const combined = buffer ? `${buffer} ${sentence}` : sentence;
    if (estimateTokens(combined) > maxTokens && buffer) {
      chunks.push({ content: buffer.trim(), token_count: estimateTokens(buffer) });
      buffer = sentence;
    } else {
      buffer = combined;
    }
  }

  if (buffer.trim()) {
    chunks.push({ content: buffer.trim(), token_count: estimateTokens(buffer) });
  }

  return chunks;
}

// ──────────────────────────────────────────
// Post-processing
// ──────────────────────────────────────────

function postprocess(chunks: ChunkResult[], minTokens: number): ChunkResult[] {
  const result: ChunkResult[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    // Skip empty
    if (!chunk.content.trim()) continue;

    // Merge tiny chunks with the next one
    if (chunk.token_count < minTokens && i < chunks.length - 1) {
      const next = chunks[i + 1];
      const merged = `${chunk.content}\n\n${next.content}`;
      chunks[i + 1] = {
        ...next,
        content: merged,
        token_count: estimateTokens(merged),
        section_path: chunk.section_path ?? next.section_path,
      };
      continue;
    }

    result.push({ ...chunk, chunk_index: result.length });
  }

  return result;
}

// ──────────────────────────────────────────
// Text extraction for different file types
// ──────────────────────────────────────────

/** Extract text from raw file bytes */
export async function extractTextFromBuffer(
  buffer: ArrayBuffer,
  fileType: string
): Promise<string> {
  const bytes = new Uint8Array(buffer);

  switch (fileType) {
    case 'txt':
    case 'md':
    case 'mdx':
    case 'html':
    case 'htm':
      return new TextDecoder('utf-8').decode(bytes);

    case 'pdf':
      return extractTextFromPdf(bytes);

    case 'docx':
    case 'doc':
      return extractTextFromDocx(bytes);

    case 'pptx':
    case 'ppt':
      return extractTextFromPptx(bytes);

    case 'xlsx':
    case 'xls':
      return extractTextFromXlsx(bytes);

    default:
      // Attempt UTF-8 decode as fallback
      return new TextDecoder('utf-8', { fatal: false, ignoreBOM: true }).decode(bytes);
  }
}

/** Basic PDF text extraction (handles most text-layer PDFs) */
function extractTextFromPdf(bytes: Uint8Array): string {
  const text = new TextDecoder('latin1').decode(bytes);
  const textParts: string[] = [];

  // Extract text streams between BT (begin text) and ET (end text) markers
  const streamRegex = /BT([\s\S]*?)ET/g;
  let match;
  while ((match = streamRegex.exec(text)) !== null) {
    const stream = match[1];
    // Extract string literals
    const stringRegex = /\(([^)\\]*(\\.[^)\\]*)*)\)\s*(?:Tj|TJ|'|")/g;
    let strMatch;
    while ((strMatch = stringRegex.exec(stream)) !== null) {
      const decoded = strMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\');
      textParts.push(decoded);
    }
    // Extract hex strings
    const hexRegex = /<([0-9A-Fa-f\s]+)>\s*(?:Tj|TJ)/g;
    let hexMatch;
    while ((hexMatch = hexRegex.exec(stream)) !== null) {
      const hex = hexMatch[1].replace(/\s/g, '');
      let decoded = '';
      for (let i = 0; i < hex.length; i += 2) {
        const code = parseInt(hex.substr(i, 2), 16);
        if (code > 31 && code < 127) decoded += String.fromCharCode(code);
      }
      if (decoded) textParts.push(decoded);
    }
    textParts.push('\n');
  }

  return textParts
    .join(' ')
    .replace(/\s+/g, ' ')
    .replace(/ \n /g, '\n')
    .trim();
}

/** Extract text from DOCX (ZIP + XML) */
async function extractTextFromDocx(bytes: Uint8Array): Promise<string> {
  // DOCX is a ZIP file - find word/document.xml
  const zipText = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true }).decode(bytes);

  // Simple XML text extraction from document.xml content
  // Find w:t (Word text) elements
  const wtRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
  const parts: string[] = [];
  let match;

  while ((match = wtRegex.exec(zipText)) !== null) {
    parts.push(match[1]);
  }

  if (parts.length > 0) {
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  // Fallback: just strip XML tags
  return zipText
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extract text from PPTX slides */
async function extractTextFromPptx(bytes: Uint8Array): Promise<string> {
  const zipText = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true }).decode(bytes);

  // Find slide content (a:t elements in DrawingML)
  const atRegex = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
  const parts: string[] = [];
  let match;

  while ((match = atRegex.exec(zipText)) !== null) {
    parts.push(match[1]);
  }

  return parts.join('\n').replace(/\s+/g, ' ').trim();
}

/** Extract text from XLSX spreadsheet */
async function extractTextFromXlsx(bytes: Uint8Array): Promise<string> {
  const zipText = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true }).decode(bytes);

  // Find cell values (v elements and inlineStr)
  const cellRegex = /<(?:v|t)[^>]*>([\s\S]*?)<\/(?:v|t)>/g;
  const parts: string[] = [];
  let match;

  while ((match = cellRegex.exec(zipText)) !== null) {
    const val = match[1].trim();
    if (val) parts.push(val);
  }

  return parts.join('\t').replace(/\t+/g, '\t').trim();
}
