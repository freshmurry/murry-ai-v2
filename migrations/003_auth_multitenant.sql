-- ================================================================
-- MurryAI / Proposal Intelligence ARIA - Auth & Multitenancy
-- D1 Database Schema Migration v3
-- Matches columns exactly as referenced in src/api/auth-handlers.ts
-- ================================================================

-- Organizations (tenants)
CREATE TABLE IF NOT EXISTS organizations (
    id                        TEXT PRIMARY KEY,
    name                      TEXT NOT NULL,
    slug                      TEXT UNIQUE NOT NULL,
    plan                      TEXT NOT NULL DEFAULT 'free', -- free, starter, pro, enterprise
    stripe_customer_id        TEXT,
    stripe_subscription_id    TEXT,
    subscription_status       TEXT DEFAULT 'inactive', -- active, canceled, past_due, trialing, inactive
    subscription_period_end   TEXT,
    max_proposals             INTEGER DEFAULT 3,
    max_users                 INTEGER DEFAULT 1,
    max_storage_mb            INTEGER DEFAULT 100,
    created_at                TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at                TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_orgs_slug ON organizations(slug);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id                        TEXT PRIMARY KEY,
    org_id                    TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email                     TEXT UNIQUE NOT NULL,
    password_hash             TEXT NOT NULL,
    password_salt             TEXT NOT NULL,
    first_name                TEXT,
    last_name                 TEXT,
    role                      TEXT NOT NULL DEFAULT 'member', -- owner, admin, member
    email_verified            INTEGER DEFAULT 0,
    verification_token        TEXT,
    reset_token               TEXT,
    reset_token_expires       TEXT,
    last_login                TEXT,
    created_at                TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at                TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- Sessions (JWT revocation list)
CREATE TABLE IF NOT EXISTS sessions (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash    TEXT NOT NULL,
    expires_at    TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);

-- Proposal Templates (org-scoped, matches spec section 3)
CREATE TABLE IF NOT EXISTS proposal_templates (
    id                TEXT PRIMARY KEY,
    org_id            TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    description       TEXT,
    industry          TEXT,
    sections_schema   TEXT NOT NULL, -- JSON
    default_content   TEXT,          -- JSON
    is_public         INTEGER DEFAULT 0,
    created_by        TEXT REFERENCES users(id),
    created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_templates_org ON proposal_templates(org_id);

-- Activity Log (audit trail)
CREATE TABLE IF NOT EXISTS activity_logs (
    id           TEXT PRIMARY KEY,
    org_id       TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    user_id      TEXT REFERENCES users(id) ON DELETE SET NULL,
    action       TEXT NOT NULL,
    entity_type  TEXT,
    entity_id    TEXT,
    metadata     TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_logs_org ON activity_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON activity_logs(created_at);

-- Webhook Events (Stripe etc. — created now so billing can be wired later
-- without another migration)
CREATE TABLE IF NOT EXISTS webhook_events (
    id           TEXT PRIMARY KEY,
    source       TEXT NOT NULL,
    event_type   TEXT NOT NULL,
    payload      TEXT NOT NULL,
    processed    INTEGER DEFAULT 0,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_webhooks_processed ON webhook_events(processed, created_at);

-- Project-level settings (backs the Settings panel — persists real values
-- instead of the old demo-only alert())
CREATE TABLE IF NOT EXISTS project_settings (
    project_id            TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    proposal_template     TEXT DEFAULT 'Standard',
    default_answer_style  TEXT DEFAULT 'formal', -- formal, conversational, technical
    quote_format          TEXT DEFAULT 'bullets',
    ai_model              TEXT DEFAULT '@cf/moonshotai/kimi-k2.7-code',
    ai_autonomy           TEXT DEFAULT 'assisted', -- assisted, auto_draft, full_auto
    updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
);
