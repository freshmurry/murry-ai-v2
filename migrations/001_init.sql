-- ================================================================
-- MurryAI - Proposal Intelligence Platform
-- D1 Database Schema v1
-- ================================================================

-- Projects (the top-level folder/knowledge-base system)
CREATE TABLE IF NOT EXISTS projects (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  description TEXT,
  type       TEXT NOT NULL DEFAULT 'proposal',   -- proposal | research | general | rfp
  status     TEXT NOT NULL DEFAULT 'active',      -- active | archived | completed
  color      TEXT DEFAULT '#3B82F6',
  icon       TEXT DEFAULT 'folder',
  metadata   TEXT,                                -- JSON
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Documents (files stored in R2, metadata here)
CREATE TABLE IF NOT EXISTS documents (
  id                TEXT PRIMARY KEY,
  project_id        TEXT REFERENCES projects(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_type         TEXT NOT NULL,               -- pdf | docx | pptx | xlsx | md | txt | png | jpg | html
  r2_key            TEXT NOT NULL UNIQUE,
  size_bytes        INTEGER DEFAULT 0,
  page_count        INTEGER,
  status            TEXT NOT NULL DEFAULT 'pending', -- pending | processing | indexed | error
  extraction_method TEXT,                         -- text | ocr | vision
  word_count        INTEGER DEFAULT 0,
  metadata          TEXT,                         -- JSON: author, date, etc.
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

-- Document Chunks (for RAG - chunked content with vector IDs)
CREATE TABLE IF NOT EXISTS document_chunks (
  id           TEXT PRIMARY KEY,
  document_id  TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  chunk_index  INTEGER NOT NULL,
  chunk_type   TEXT DEFAULT 'text',              -- text | table | header | list | code
  vector_id    TEXT,                             -- ID in Vectorize index
  token_count  INTEGER,
  page_number  INTEGER,
  section_path TEXT,                             -- e.g. "Section 1 > 1.2 > Introduction"
  metadata     TEXT,                             -- JSON
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_chunks_document ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_project ON document_chunks(project_id);
CREATE INDEX IF NOT EXISTS idx_chunks_vector ON document_chunks(vector_id);

-- Conversations (chat sessions)
CREATE TABLE IF NOT EXISTS conversations (
  id         TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  title      TEXT,
  mode       TEXT DEFAULT 'chat',               -- chat | proposal | research | qa
  metadata   TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_conversations_project ON conversations(project_id);

-- Messages (full chat history)
CREATE TABLE IF NOT EXISTS messages (
  id              TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,                 -- user | assistant | system | tool_result
  content         TEXT NOT NULL,
  tool_calls      TEXT,                          -- JSON array of ToolCall objects
  citations       TEXT,                          -- JSON array of Citation objects
  agent_thoughts  TEXT,                          -- chain-of-thought reasoning
  metadata        TEXT,                          -- JSON: token counts, model used, etc.
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

-- Q&A Pairs (proposal question/answer tracking)
CREATE TABLE IF NOT EXISTS qa_pairs (
  id                TEXT PRIMARY KEY,
  project_id        TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  document_id       TEXT REFERENCES documents(id) ON DELETE SET NULL,
  question          TEXT NOT NULL,
  answer            TEXT,
  answer_draft      TEXT,
  source_references TEXT,                        -- JSON array of {doc, page, section}
  status            TEXT NOT NULL DEFAULT 'pending', -- pending | draft | answered | reviewed | approved
  category          TEXT,
  section_reference TEXT,
  page_reference    TEXT,
  volume            TEXT,                        -- which proposal volume this answers
  word_limit        INTEGER,
  priority          TEXT DEFAULT 'medium',       -- low | medium | high | critical
  assignee          TEXT,
  metadata          TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_qa_project ON qa_pairs(project_id);
CREATE INDEX IF NOT EXISTS idx_qa_status ON qa_pairs(status);

-- Compliance Matrix (proposal compliance tracking)
CREATE TABLE IF NOT EXISTS compliance_matrix (
  id               TEXT PRIMARY KEY,
  project_id       TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requirement      TEXT NOT NULL,
  requirement_ref  TEXT,                         -- Section L, M, etc.
  section          TEXT,
  instruction      TEXT,                         -- what the solicitation asks
  evaluation_factor TEXT,                        -- how it's evaluated
  status           TEXT NOT NULL DEFAULT 'pending', -- compliant | non_compliant | partial | pending | na
  response_section TEXT,                         -- where in our proposal we address it
  evidence         TEXT,                         -- what we have
  gap              TEXT,                         -- what's missing
  action_required  TEXT,
  priority         TEXT DEFAULT 'medium',
  metadata         TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_compliance_project ON compliance_matrix(project_id);

-- Agent Tasks (human-in-the-loop approvals)
CREATE TABLE IF NOT EXISTS agent_tasks (
  id              TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
  project_id      TEXT REFERENCES projects(id) ON DELETE CASCADE,
  task_type       TEXT NOT NULL,                 -- create_document | send_email | delete | external_call
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected | completed | cancelled
  requires_approval INTEGER NOT NULL DEFAULT 1,
  input           TEXT,                          -- JSON: task inputs
  output          TEXT,                          -- JSON: task result after execution
  approved_by     TEXT,
  rejection_reason TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Workflow Runs (background processing audit log)
CREATE TABLE IF NOT EXISTS workflow_runs (
  id            TEXT PRIMARY KEY,
  project_id    TEXT REFERENCES projects(id),
  document_id   TEXT REFERENCES documents(id),
  workflow_type TEXT NOT NULL,                   -- document_ingestion | proposal_analysis | qa_extraction
  status        TEXT NOT NULL DEFAULT 'running', -- running | completed | failed | cancelled
  progress      INTEGER NOT NULL DEFAULT 0,      -- 0-100
  steps_log     TEXT,                            -- JSON array of step results
  result        TEXT,                            -- JSON final result
  error         TEXT,
  started_at    TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at  TEXT
);

CREATE INDEX IF NOT EXISTS idx_runs_document ON workflow_runs(document_id);

-- Skills / Brain Entries (persistent agent knowledge)
CREATE TABLE IF NOT EXISTS brain_entries (
  id         TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,                      -- fact | preference | process | contact | insight
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  tags       TEXT,                               -- JSON array
  source     TEXT,                               -- where this knowledge came from
  confidence REAL DEFAULT 1.0,
  metadata   TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_brain_project ON brain_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_brain_type ON brain_entries(type);
