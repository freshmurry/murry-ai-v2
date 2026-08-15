-- ================================================================
-- MurryAI - Proposals & Proposal Sections Tables
-- D1 Database Schema Migration v2
-- ================================================================

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

CREATE INDEX IF NOT EXISTS idx_proposals_client ON proposals(client_name);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);

CREATE TABLE IF NOT EXISTS proposal_sections (
  id           TEXT PRIMARY KEY,
  proposal_id  TEXT NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  order_index  INTEGER NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_proposal_sections_proposal ON proposal_sections(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_sections_order ON proposal_sections(proposal_id, order_index);
