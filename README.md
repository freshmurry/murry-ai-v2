# MurryAI — Agentic Proposal Intelligence Platform

> Your personal AI assistant for proposal development, document analysis, and knowledge management — powered entirely by Cloudflare's edge infrastructure.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge                          │
│                                                             │
│  ┌──────────────┐   ┌────────────────────────────────────┐  │
│  │   React SPA  │   │      Cloudflare Worker (API)       │  │
│  │  (index.html)│──▶│  Router + REST + WebSocket Proxy   │  │
│  └──────────────┘   └──────────────┬───────────────────┘  │
│                                    │                        │
│  ┌─────────────────┐  ┌────────────▼────────────────────┐  │
│  │  Durable Objects│  │     Conversation DO (per-chat)  │  │
│  │  (persistent    │  │  ┌─────────────────────────────┐│  │
│  │   WebSocket +   │◀─┤  │  ProposalAgent (agentic loop)││  │
│  │   state)        │  │  │  ├─ search_knowledge_base    ││  │
│  └─────────────────┘  │  │  ├─ extract_qa_pairs         ││  │
│                        │  │  ├─ create_compliance_matrix ││  │
│  ┌─────────────────┐  │  │  ├─ generate_executive_summary││  │
│  │  Workflows      │  │  │  ├─ save_to_brain             ││  │
│  │  (background)   │  │  │  └─ create_document_draft     ││  │
│  │  ├─ Document    │  │  └─────────────────────────────┘│  │
│  │  │  Ingestion   │  └─────────────────────────────────┘  │
│  │  └─ Proposal    │                                        │
│  │     Analysis    │  ┌─────────┐  ┌────────┐  ┌────────┐  │
│  └─────────────────┘  │   D1   │  │   R2   │  │  KV    │  │
│                        │ SQLite │  │Objects │  │ Cache  │  │
│  ┌─────────────────┐  └─────────┘  └────────┘  └────────┘  │
│  │  Workers AI     │                                        │
│  │  ├─ Embeddings  │  ┌─────────────────────────────────┐  │
│  │  │  (BGE base)  │  │  Vectorize (semantic search)    │  │
│  │  └─ Vision/OCR  │  │  768-dim cosine similarity      │  │
│  └─────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                    Anthropic Claude API
                 (claude-sonnet-4-20250514)
               Agentic reasoning + generation
```

---

## ⚡ Quick Start

### 1. Prerequisites

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Verify account
wrangler whoami
```

### 2. Create Cloudflare Resources

```bash
# Create D1 database
wrangler d1 create murry-ai-db
# 📋 Copy the database_id output → paste into wrangler.toml

# Create R2 bucket
wrangler r2 bucket create murry-ai-documents

# Create KV namespace
wrangler kv namespace create murry-ai-cache
# 📋 Copy the id output → paste into wrangler.toml

# Create Vectorize index (768 dimensions for BGE base model)
wrangler vectorize create murry-ai-vectors --dimensions=768 --metric=cosine
```

### 3. Update wrangler.toml

Replace the placeholder IDs in `wrangler.toml`:
```toml
[[d1_databases]]
database_id = "YOUR_D1_DATABASE_ID_HERE"   # from step 2

[[kv_namespaces]]
id = "YOUR_KV_NAMESPACE_ID_HERE"           # from step 2
```

### 4. Set Secrets

```bash
# Your Anthropic API key (get from console.anthropic.com)
wrangler secret put ANTHROPIC_API_KEY
```

### 5. Run Migrations

```bash
# Local development
npm run db:migrate

# Production (remote)
npm run db:migrate:remote
```

### 6. Start Development Server

```bash
npm run dev
# → http://localhost:8787
```

### 7. Deploy to Production

```bash
npm run deploy
# → https://murry-ai.YOUR_SUBDOMAIN.workers.dev
```

---

## 📁 Project Structure

```
murry-ai/
├── src/
│   ├── index.ts                    # Main Worker entry point (router)
│   ├── types.ts                    # All TypeScript types + utilities
│   ├── api/
│   │   └── handlers.ts             # REST API handlers
│   ├── agents/
│   │   └── ProposalAgent.ts        # 🧠 Main agentic loop + all tools
│   ├── durable-objects/
│   │   └── ConversationDO.ts       # WebSocket + persistent chat state
│   ├── lib/
│   │   ├── anthropic.ts            # Claude API client (streaming)
│   │   ├── chunker.ts              # Document chunking engine
│   │   └── rag.ts                  # RAG pipeline (embed/search/rerank)
│   └── workflows/
│       └── DocumentIngestionWorkflow.ts  # Background doc processing
├── migrations/
│   └── 001_init.sql                # D1 database schema
├── public/
│   └── index.html                  # 🎨 Full React SPA (single file)
├── wrangler.toml                   # Cloudflare config
├── package.json
└── tsconfig.json
```

---

## 🧠 Agent Capabilities

The ProposalAgent has 15 built-in tools:

| Tool | Description |
|------|-------------|
| `search_knowledge_base` | Semantic search with reranking |
| `list_documents` | Browse uploaded files |
| `get_document_content` | Read full document text |
| `list_projects` | Navigate project folders |
| `extract_qa_pairs` | Auto-extract RFP questions |
| `answer_proposal_question` | Generate Q&A responses |
| `create_compliance_matrix` | Build compliance tracker |
| `generate_proposal_outline` | Create section outlines |
| `generate_executive_summary` | Write exec summaries |
| `save_to_brain` | Store persistent knowledge |
| `get_brain_knowledge` | Retrieve from memory |
| `update_qa_answer` | Edit Q&A tracker |
| `update_compliance_status` | Update compliance matrix |
| `create_document_draft` | Create files (requires approval) |

---

## 📤 Supported File Types

| Format | Extension | Extraction Method |
|--------|-----------|-------------------|
| PDF | `.pdf` | Text layer extraction |
| Word | `.docx`, `.doc` | XML text extraction |
| PowerPoint | `.pptx`, `.ppt` | DrawingML text extraction |
| Excel | `.xlsx`, `.xls` | Cell value extraction |
| Markdown | `.md`, `.mdx` | Direct text |
| Plain text | `.txt` | Direct text |
| HTML | `.html`, `.htm` | Tag-stripped text |
| Images | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` | Workers AI Vision/OCR |

---

## 🔄 Document Ingestion Pipeline

When you upload a document, a background Workflow runs:

```
Upload → R2 Storage
              ↓
        Workers AI or text extraction
              ↓
        Smart chunking (400 token max, semantic boundaries)
              ↓
        BGE-base embeddings (768 dim)  
              ↓
        Vectorize index + D1 metadata
              ↓
        Status: "indexed" ✅
```

---

## 💬 Agent Modes

Switch between modes in the chat UI:

| Mode | Best For |
|------|----------|
| **General** | General questions, document Q&A |
| **Proposal** | Proposal writing, RFP analysis (Shipley method) |
| **Research** | Deep analysis, cross-document synthesis |
| **Q&A** | Writing evaluation question responses |

---

## 🔐 Human-in-the-Loop

Certain agent actions require your explicit approval before executing:
- Creating/saving document drafts
- Any external API calls
- Data deletion operations

An approval card appears in the chat UI with Approve/Reject buttons.

---

## 🛠️ Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `ANTHROPIC_API_KEY` | `wrangler secret` | Your Anthropic API key |
| `ENVIRONMENT` | `wrangler.toml` | `development` or `production` |
| `APP_NAME` | `wrangler.toml` | Display name |

---

## 📊 Database Schema (D1)

- **projects** — Project folders with type/status
- **documents** — File metadata (content in R2)
- **document_chunks** — RAG chunks with vector IDs
- **conversations** — Chat sessions
- **messages** — Full message history with tool calls + citations
- **qa_pairs** — Proposal Q&A tracker
- **compliance_matrix** — RFP compliance tracking
- **agent_tasks** — Human-in-the-loop approval queue
- **workflow_runs** — Background processing audit log
- **brain_entries** — Persistent AI knowledge store

---

## 🚀 Roadmap / Extensions

- [ ] Proposal Analysis Workflow (batch process multiple docs)
- [ ] Email integration (SMTP agent tool)
- [ ] PDF export of compliance matrix and Q&A
- [ ] Multi-user support with auth
- [ ] Slack/Teams notifications for workflow completion
- [ ] Custom agent personas per project
- [ ] Version control for document drafts
- [ ] Proposal win probability scoring

---

## 🆘 Troubleshooting

**WebSocket won't connect:**
- Check Durable Objects are enabled on your Workers plan (requires paid plan)
- Ensure `compatibility_flags = ["nodejs_compat"]` in wrangler.toml

**Embeddings failing:**
- Verify Workers AI is enabled in Cloudflare dashboard
- Check the Vectorize index dimensions match (768 for BGE base)

**Documents stuck in "processing":**
- Workflows require a paid Workers plan
- Check `wrangler tail` for workflow errors

**D1 queries failing:**
- Re-run migrations: `npm run db:migrate:remote`
- Verify database_id in wrangler.toml matches your actual D1 database
