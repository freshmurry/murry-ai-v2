// ================================================================
// MurryAI - Core Type Definitions
// ================================================================

/** Cloudflare Worker environment bindings */
export interface Env {
  // Durable Objects
  CONVERSATION_DO: DurableObjectNamespace;
  PROJECT_DO: DurableObjectNamespace;

  // Storage
  DB: D1Database;
  R2: R2Bucket;
  KV_CACHE: KVNamespace;

  // AI
  AI: Ai;
  VECTOR_INDEX: VectorizeIndex;

  // Workflows
  DOCUMENT_INGESTION: Workflow;
  PROPOSAL_ANALYSIS: Workflow;

  // Secrets (set with: wrangler secret put ANTHROPIC_API_KEY)
  ANTHROPIC_API_KEY: string;

  // Static assets
  ASSETS: Fetcher;

  // Vars
  ENVIRONMENT: string;
  APP_NAME: string;
}

// ──────────────────────────────────────────
// Domain Models
// ──────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description?: string;
  type: 'proposal' | 'research' | 'general' | 'rfp';
  status: 'active' | 'archived' | 'completed';
  color?: string;
  icon?: string;
  metadata?: Record<string, unknown>;
  document_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  project_id: string;
  name: string;
  original_filename: string;
  file_type: DocumentFileType;
  r2_key: string;
  size_bytes: number;
  page_count?: number;
  status: DocumentStatus;
  extraction_method?: string;
  word_count?: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type DocumentFileType = 'pdf' | 'docx' | 'doc' | 'pptx' | 'ppt' | 'xlsx' | 'xls'
  | 'md' | 'mdx' | 'txt' | 'html' | 'htm' | 'png' | 'jpg' | 'jpeg' | 'gif' | 'webp';

export type DocumentStatus = 'pending' | 'processing' | 'indexed' | 'error';

export interface DocumentChunk {
  id: string;
  document_id: string;
  project_id: string;
  content: string;
  chunk_index: number;
  chunk_type: 'text' | 'table' | 'header' | 'list' | 'code';
  vector_id?: string;
  token_count?: number;
  page_number?: number;
  section_path?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ──────────────────────────────────────────
// Conversation & Messaging
// ──────────────────────────────────────────

export interface Conversation {
  id: string;
  project_id?: string;
  title?: string;
  mode: 'chat' | 'proposal' | 'research' | 'qa';
  metadata?: Record<string, unknown>;
  messages?: Message[];
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool_result';
  content: string;
  tool_calls?: ToolCall[];
  citations?: Citation[];
  agent_thoughts?: string;
  metadata?: {
    model?: string;
    input_tokens?: number;
    output_tokens?: number;
    latency_ms?: number;
    requires_approval?: boolean;
    task_id?: string;
  };
  created_at: string;
}

// ──────────────────────────────────────────
// Agent & Tools
// ──────────────────────────────────────────

export interface ToolCall {
  id: string;
  name: AgentToolName;
  input: Record<string, unknown>;
  output?: unknown;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'awaiting_approval';
  error?: string;
  started_at?: string;
  completed_at?: string;
}

export type AgentToolName =
  | 'search_knowledge_base'
  | 'get_document_content'
  | 'create_compliance_matrix'
  | 'extract_qa_pairs'
  | 'generate_proposal_outline'
  | 'generate_executive_summary'
  | 'answer_proposal_question'
  | 'save_to_brain'
  | 'get_brain_knowledge'
  | 'list_documents'
  | 'list_projects'
  | 'create_project'
  | 'create_document_draft'
  | 'update_qa_answer'
  | 'update_compliance_status'
  | 'calculate_word_count'
  | 'format_proposal_section';

export interface AgentTool {
  name: AgentToolName;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface AgentTask {
  id: string;
  conversation_id?: string;
  project_id?: string;
  task_type: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  requires_approval: boolean;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  approved_by?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

// ──────────────────────────────────────────
// RAG & Search
// ──────────────────────────────────────────

export interface Citation {
  document_id: string;
  document_name: string;
  chunk_id: string;
  content: string;
  relevance_score: number;
  page_number?: number;
  section_path?: string;
  project_id: string;
}

export interface SearchResult {
  chunk: DocumentChunk;
  document: Document;
  score: number;
}

export interface RAGContext {
  context_text: string;
  citations: Citation[];
  total_chunks: number;
  tokens_used: number;
}

// ──────────────────────────────────────────
// Proposal-specific types
// ──────────────────────────────────────────

export interface QAPair {
  id: string;
  project_id: string;
  document_id?: string;
  question: string;
  answer?: string;
  answer_draft?: string;
  source_references?: Array<{ doc: string; page?: string; section?: string }>;
  status: 'pending' | 'draft' | 'answered' | 'reviewed' | 'approved';
  category?: string;
  section_reference?: string;
  page_reference?: string;
  volume?: string;
  word_limit?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ComplianceItem {
  id: string;
  project_id: string;
  requirement: string;
  requirement_ref?: string;
  section?: string;
  instruction?: string;
  evaluation_factor?: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'pending' | 'na';
  response_section?: string;
  evidence?: string;
  gap?: string;
  action_required?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BrainEntry {
  id: string;
  project_id?: string;
  type: 'fact' | 'preference' | 'process' | 'contact' | 'insight';
  title: string;
  content: string;
  tags?: string[];
  source?: string;
  confidence: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ──────────────────────────────────────────
// Workflow types
// ──────────────────────────────────────────

export interface WorkflowRun {
  id: string;
  project_id?: string;
  document_id?: string;
  workflow_type: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  steps_log?: Array<{ step: string; status: string; result?: unknown; ts: string }>;
  result?: Record<string, unknown>;
  error?: string;
  started_at: string;
  completed_at?: string;
}

export interface DocumentIngestionParams {
  document_id: string;
  project_id: string;
  r2_key: string;
  file_type: DocumentFileType;
  document_name: string;
}

export interface ProposalAnalysisParams {
  project_id: string;
  document_ids: string[];
  analysis_types: Array<'compliance' | 'qa' | 'outline' | 'summary'>;
}

// ──────────────────────────────────────────
// WebSocket messaging
// ──────────────────────────────────────────

export type WSClientMessage =
  | { type: 'chat'; content: string; conversation_id: string; project_id?: string; mode?: string }
  | { type: 'approve_task'; task_id: string; approved: boolean; reason?: string }
  | { type: 'subscribe'; conversation_id: string }
  | { type: 'ping' };

export type WSServerMessage =
  | { type: 'chunk'; content: string; message_id: string }
  | { type: 'thinking'; thought: string }
  | { type: 'tool_start'; tool: ToolCall }
  | { type: 'tool_complete'; tool_id: string; result: unknown }
  | { type: 'approval_required'; task: AgentTask }
  | { type: 'citations'; citations: Citation[] }
  | { type: 'message_complete'; message: Message }
  | { type: 'error'; error: string; code?: string }
  | { type: 'pong' };

// ──────────────────────────────────────────
// API Response types
// ──────────────────────────────────────────

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
}

export function apiOk<T>(data: T, metadata?: Record<string, unknown>): APIResponse<T> {
  return { success: true, data, metadata };
}

export function apiError(error: string, code?: number): Response {
  return new Response(JSON.stringify({ success: false, error } satisfies APIResponse), {
    status: code ?? 500,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function apiJson<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ──────────────────────────────────────────
// Utility
// ──────────────────────────────────────────

export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

export function now(): string {
  return new Date().toISOString();
}

export const SUPPORTED_FILE_TYPES: DocumentFileType[] = [
  'pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls',
  'md', 'mdx', 'txt', 'html', 'htm', 'png', 'jpg', 'jpeg', 'gif', 'webp',
];

export const FILE_TYPE_MIME: Record<string, DocumentFileType> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'text/markdown': 'md',
  'text/plain': 'txt',
  'text/html': 'html',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};
