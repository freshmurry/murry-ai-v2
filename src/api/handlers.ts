// ================================================================
// MurryAI - API Route Handlers
// Documents, Projects, Q&A, Compliance, Search APIs
// ================================================================

import type {
  Env, Project, Document, QAPair, ComplianceItem, BrainEntry,
  DocumentIngestionParams,
} from '../types';
import { generateId, now, apiJson, apiError, SUPPORTED_FILE_TYPES, FILE_TYPE_MIME } from '../types';

// ──────────────────────────────────────────
// PROJECTS API
// ──────────────────────────────────────────

export async function handleProjects(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const projectId = segments[2]; // /api/projects/:id

  if (request.method === 'GET' && !projectId) {
    return listProjects(request, env);
  }
  if (request.method === 'POST' && !projectId) {
    return createProject(request, env);
  }
  if (request.method === 'GET' && projectId) {
    return getProject(projectId, env);
  }
  if (request.method === 'PUT' && projectId) {
    return updateProject(projectId, request, env);
  }
  if (request.method === 'DELETE' && projectId) {
    return deleteProject(projectId, env);
  }

  return apiError('Method not allowed', 405);
}

async function listProjects(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');

  let sql = `SELECT p.*, COUNT(d.id) as document_count
             FROM projects p
             LEFT JOIN documents d ON d.project_id = p.id
             WHERE 1=1`;
  const params: unknown[] = [];

  if (status) { sql += ' AND p.status = ?'; params.push(status); }
  sql += ' GROUP BY p.id ORDER BY p.updated_at DESC';

  const result = await env.DB.prepare(sql).bind(...params).all<Project & { document_count: number }>();
  return apiJson({ success: true, data: result.results });
}

async function createProject(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as Partial<Project>;

  if (!body.name) return apiError('name is required', 400);

  const id = generateId('proj');
  await env.DB.prepare(`
    INSERT INTO projects (id, name, description, type, status, color, icon, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, body.name, body.description ?? null,
    body.type ?? 'proposal', body.status ?? 'active',
    body.color ?? '#3B82F6', body.icon ?? 'folder',
    body.metadata ? JSON.stringify(body.metadata) : null
  ).run();

  const project = await env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first<Project>();
  return apiJson({ success: true, data: project }, 201);
}

async function getProject(projectId: string, env: Env): Promise<Response> {
  const project = await env.DB.prepare('SELECT * FROM projects WHERE id = ?')
    .bind(projectId).first<Project>();
  if (!project) return apiError('Project not found', 404);
  return apiJson({ success: true, data: project });
}

async function updateProject(projectId: string, request: Request, env: Env): Promise<Response> {
  const body = await request.json() as Partial<Project>;
  const fields: string[] = [];
  const values: unknown[] = [];

  if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name); }
  if (body.description !== undefined) { fields.push('description = ?'); values.push(body.description); }
  if (body.status !== undefined) { fields.push('status = ?'); values.push(body.status); }
  if (body.color !== undefined) { fields.push('color = ?'); values.push(body.color); }
  if (body.metadata !== undefined) { fields.push('metadata = ?'); values.push(JSON.stringify(body.metadata)); }

  if (fields.length === 0) return apiError('No fields to update', 400);

  fields.push('updated_at = ?');
  values.push(now());
  values.push(projectId);

  await env.DB.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  const updated = await env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(projectId).first<Project>();
  return apiJson({ success: true, data: updated });
}

async function deleteProject(projectId: string, env: Env): Promise<Response> {
  await env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(projectId).run();
  return apiJson({ success: true, data: { deleted: true, id: projectId } });
}

// ──────────────────────────────────────────
// DOCUMENTS API
// ──────────────────────────────────────────

export async function handleDocuments(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const docId = segments[2];

  if (request.method === 'GET' && !docId) return listDocuments(request, env);
  if (request.method === 'POST' && !docId) return uploadDocument(request, env);
  if (request.method === 'GET' && docId) return getDocument(docId, env);
  if (request.method === 'GET' && docId && segments[3] === 'content') return getDocumentContent(docId, env);
  if (request.method === 'DELETE' && docId) return deleteDocument(docId, env);

  return apiError('Method not allowed', 405);
}

async function listDocuments(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const projectId = url.searchParams.get('project_id');
  const status = url.searchParams.get('status');

  let sql = 'SELECT * FROM documents WHERE 1=1';
  const params: unknown[] = [];

  if (projectId) { sql += ' AND project_id = ?'; params.push(projectId); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC';

  const result = await env.DB.prepare(sql).bind(...params).all<Document>();
  return apiJson({ success: true, data: result.results });
}

export async function uploadDocument(request: Request, env: Env): Promise<Response> {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const projectId = formData.get('project_id') as string | null;
  const documentName = formData.get('name') as string | null;

  if (!file) return apiError('file is required', 400);
  if (!projectId) return apiError('project_id is required', 400);

  // Determine file type
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mimeType = file.type;
  const fileType = (FILE_TYPE_MIME[mimeType] ?? ext) as string;

  if (!SUPPORTED_FILE_TYPES.includes(fileType as never)) {
    return apiError(`Unsupported file type: ${ext}. Supported: ${SUPPORTED_FILE_TYPES.join(', ')}`, 400);
  }

  const docId = generateId('doc');
  const r2Key = `projects/${projectId}/documents/${docId}.${ext}`;
  const docName = documentName ?? file.name.replace(/\.[^/.]+$/, '');

  // Upload to R2
  const bytes = await file.arrayBuffer();
  await env.DOCUMENTS_BUCKET.put(r2Key, bytes, {
    httpMetadata: { contentType: mimeType },
    customMetadata: {
      project_id: projectId,
      document_name: docName,
      original_filename: file.name,
    },
  });

  // Create document record
  await env.DB.prepare(`
    INSERT INTO documents (id, project_id, name, original_filename, file_type, r2_key, size_bytes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `).bind(docId, projectId, docName, file.name, fileType, r2Key, file.size).run();

  // Create workflow run record
  const runId = generateId('run');
  await env.DB.prepare(`
    INSERT INTO workflow_runs (id, project_id, document_id, workflow_type, status, progress)
    VALUES (?, ?, ?, 'document_ingestion', 'running', 0)
  `).bind(runId, projectId, docId).run();

  // Trigger background ingestion workflow
  try {
    const params: DocumentIngestionParams = {
      document_id: docId,
      project_id: projectId,
      r2_key: r2Key,
      file_type: fileType as never,
      document_name: docName,
    };
    await env.DOCUMENT_INGESTION.create({ params });
  } catch (err) {
    // Workflow creation failed — update status
    await env.DB.prepare("UPDATE documents SET status = 'error' WHERE id = ?").bind(docId).run();
    return apiError(`Failed to start ingestion workflow: ${String(err)}`, 500);
  }

  const doc = await env.DB.prepare('SELECT * FROM documents WHERE id = ?').bind(docId).first<Document>();
  return apiJson({ success: true, data: { document: doc, workflow_run_id: runId } }, 201);
}

async function getDocument(docId: string, env: Env): Promise<Response> {
  const doc = await env.DB.prepare('SELECT * FROM documents WHERE id = ?').bind(docId).first<Document>();
  if (!doc) return apiError('Document not found', 404);

  const chunkCount = await env.DB.prepare('SELECT COUNT(*) as count FROM document_chunks WHERE document_id = ?')
    .bind(docId).first<{ count: number }>();

  const workflowRun = await env.DB.prepare(
    'SELECT * FROM workflow_runs WHERE document_id = ? ORDER BY started_at DESC LIMIT 1'
  ).bind(docId).first();

  return apiJson({ success: true, data: { ...doc, chunk_count: chunkCount?.count ?? 0, latest_run: workflowRun } });
}

async function getDocumentContent(docId: string, env: Env): Promise<Response> {
  const doc = await env.DB.prepare('SELECT r2_key FROM documents WHERE id = ?').bind(docId).first<{ r2_key: string }>();
  if (!doc) return apiError('Document not found', 404);

  const object = await env.DOCUMENTS_BUCKET.get(doc.r2_key);
  if (!object) return apiError('File not found in storage', 404);

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': 'private, max-age=3600',
    },
  });
}

async function deleteDocument(docId: string, env: Env): Promise<Response> {
  const doc = await env.DB.prepare('SELECT r2_key FROM documents WHERE id = ?').bind(docId).first<{ r2_key: string }>();
  if (!doc) return apiError('Document not found', 404);

  // Delete from R2
  await env.DOCUMENTS_BUCKET.delete(doc.r2_key);

  // Get vector IDs to delete
  const chunks = await env.DB.prepare(
    'SELECT vector_id FROM document_chunks WHERE document_id = ? AND vector_id IS NOT NULL'
  ).bind(docId).all<{ vector_id: string }>();

  if (chunks.results.length > 0) {
    await env.VECTORIZE.deleteByIds(chunks.results.map((c) => c.vector_id));
  }

  // Delete from D1 (cascade handles chunks)
  await env.DB.prepare('DELETE FROM documents WHERE id = ?').bind(docId).run();

  return apiJson({ success: true, data: { deleted: true, id: docId } });
}

// ──────────────────────────────────────────
// Q&A API
// ──────────────────────────────────────────

export async function handleQA(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const qaId = segments[2];

  if (request.method === 'GET' && !qaId) {
    const projectId = url.searchParams.get('project_id');
    const status = url.searchParams.get('status');
    let sql = 'SELECT * FROM qa_pairs WHERE 1=1';
    const params: unknown[] = [];
    if (projectId) { sql += ' AND project_id = ?'; params.push(projectId); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY priority DESC, created_at ASC';
    const result = await env.DB.prepare(sql).bind(...params).all<QAPair>();
    return apiJson({ success: true, data: result.results });
  }

  if (request.method === 'PUT' && qaId) {
    const body = await request.json() as Partial<QAPair>;
    const fields: string[] = [];
    const values: unknown[] = [];
    const allowed = ['answer', 'answer_draft', 'status', 'category', 'priority', 'section_reference', 'assignee'];
    for (const field of allowed) {
      if (field in body) { fields.push(`${field} = ?`); values.push((body as Record<string, unknown>)[field]); }
    }
    if (fields.length === 0) return apiError('No fields to update', 400);
    fields.push('updated_at = ?'); values.push(now()); values.push(qaId);
    await env.DB.prepare(`UPDATE qa_pairs SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    const updated = await env.DB.prepare('SELECT * FROM qa_pairs WHERE id = ?').bind(qaId).first<QAPair>();
    return apiJson({ success: true, data: updated });
  }

  if (request.method === 'DELETE' && qaId) {
    await env.DB.prepare('DELETE FROM qa_pairs WHERE id = ?').bind(qaId).run();
    return apiJson({ success: true, data: { deleted: true, id: qaId } });
  }

  return apiError('Method not allowed', 405);
}

// ──────────────────────────────────────────
// COMPLIANCE API
// ──────────────────────────────────────────

export async function handleCompliance(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const itemId = segments[2];

  if (request.method === 'GET' && !itemId) {
    const projectId = url.searchParams.get('project_id');
    const status = url.searchParams.get('status');
    let sql = 'SELECT * FROM compliance_matrix WHERE 1=1';
    const params: unknown[] = [];
    if (projectId) { sql += ' AND project_id = ?'; params.push(projectId); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY priority DESC, requirement_ref ASC';
    const result = await env.DB.prepare(sql).bind(...params).all<ComplianceItem>();
    return apiJson({ success: true, data: result.results });
  }

  if (request.method === 'PUT' && itemId) {
    const body = await request.json() as Partial<ComplianceItem>;
    const fields: string[] = [];
    const values: unknown[] = [];
    const allowed = ['status', 'response_section', 'evidence', 'gap', 'action_required', 'priority'];
    for (const field of allowed) {
      if (field in body) { fields.push(`${field} = ?`); values.push((body as Record<string, unknown>)[field]); }
    }
    if (fields.length === 0) return apiError('No fields to update', 400);
    fields.push('updated_at = ?'); values.push(now()); values.push(itemId);
    await env.DB.prepare(`UPDATE compliance_matrix SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    const updated = await env.DB.prepare('SELECT * FROM compliance_matrix WHERE id = ?').bind(itemId).first<ComplianceItem>();
    return apiJson({ success: true, data: updated });
  }

  return apiError('Method not allowed', 405);
}

// ──────────────────────────────────────────
// CONVERSATIONS API
// ──────────────────────────────────────────

export async function handleConversations(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const convId = segments[2];

  if (request.method === 'GET' && !convId) {
    const projectId = url.searchParams.get('project_id');
    let sql = 'SELECT * FROM conversations WHERE 1=1';
    const params: unknown[] = [];
    if (projectId) { sql += ' AND project_id = ?'; params.push(projectId); }
    sql += ' ORDER BY updated_at DESC LIMIT 50';
    const result = await env.DB.prepare(sql).bind(...params).all();
    return apiJson({ success: true, data: result.results });
  }

  if (request.method === 'POST' && !convId) {
    const body = await request.json() as { project_id?: string; mode?: string; title?: string };
    const id = generateId('conv');
    await env.DB.prepare(`
      INSERT INTO conversations (id, project_id, title, mode) VALUES (?, ?, ?, ?)
    `).bind(id, body.project_id ?? null, body.title ?? 'New Conversation', body.mode ?? 'general').run();
    const conv = await env.DB.prepare('SELECT * FROM conversations WHERE id = ?').bind(id).first();
    return apiJson({ success: true, data: conv }, 201);
  }

  if (request.method === 'GET' && convId) {
    const conv = await env.DB.prepare('SELECT * FROM conversations WHERE id = ?').bind(convId).first();
    if (!conv) return apiError('Conversation not found', 404);

    const messages = await env.DB.prepare(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
    ).bind(convId).all();

    return apiJson({ success: true, data: { ...conv, messages: messages.results } });
  }

  if (request.method === 'DELETE' && convId) {
    await env.DB.prepare('DELETE FROM conversations WHERE id = ?').bind(convId).run();
    return apiJson({ success: true, data: { deleted: true, id: convId } });
  }

  return apiError('Method not allowed', 405);
}

// ──────────────────────────────────────────
// BRAIN API
// ──────────────────────────────────────────

export async function handleBrain(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const entryId = segments[2];

  if (request.method === 'GET' && !entryId) {
    const projectId = url.searchParams.get('project_id');
    const type = url.searchParams.get('type');
    let sql = 'SELECT * FROM brain_entries WHERE 1=1';
    const params: unknown[] = [];
    if (projectId) { sql += ' AND (project_id = ? OR project_id IS NULL)'; params.push(projectId); }
    if (type) { sql += ' AND type = ?'; params.push(type); }
    sql += ' ORDER BY updated_at DESC LIMIT 100';
    const result = await env.DB.prepare(sql).bind(...params).all<BrainEntry>();
    return apiJson({ success: true, data: result.results });
  }

  if (request.method === 'POST' && !entryId) {
    const body = await request.json() as Partial<BrainEntry>;
    if (!body.type || !body.title || !body.content) return apiError('type, title, content are required', 400);
    const id = generateId('brain');
    await env.DB.prepare(`
      INSERT INTO brain_entries (id, project_id, type, title, content, tags, source)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, body.project_id ?? null, body.type, body.title, body.content, JSON.stringify(body.tags ?? []), body.source ?? 'manual').run();
    const entry = await env.DB.prepare('SELECT * FROM brain_entries WHERE id = ?').bind(id).first<BrainEntry>();
    return apiJson({ success: true, data: entry }, 201);
  }

  if (request.method === 'DELETE' && entryId) {
    await env.DB.prepare('DELETE FROM brain_entries WHERE id = ?').bind(entryId).run();
    return apiJson({ success: true, data: { deleted: true, id: entryId } });
  }

  return apiError('Method not allowed', 405);
}

// ──────────────────────────────────────────
// WORKFLOW STATUS API
// ──────────────────────────────────────────

export async function handleWorkflows(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const documentId = url.searchParams.get('document_id');
  const projectId = url.searchParams.get('project_id');

  if (documentId) {
    const run = await env.DB.prepare(
      'SELECT * FROM workflow_runs WHERE document_id = ? ORDER BY started_at DESC LIMIT 1'
    ).bind(documentId).first();
    return apiJson({ success: true, data: run });
  }

  if (projectId) {
    const runs = await env.DB.prepare(
      'SELECT * FROM workflow_runs WHERE project_id = ? ORDER BY started_at DESC LIMIT 20'
    ).bind(projectId).all();
    return apiJson({ success: true, data: runs.results });
  }

  const runs = await env.DB.prepare(
    'SELECT * FROM workflow_runs ORDER BY started_at DESC LIMIT 50'
  ).all();
  return apiJson({ success: true, data: runs.results });
}
