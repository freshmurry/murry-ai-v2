/**
 * DOCX Export API Handler.
 * Loads proposal & sections from D1 database, builds DOCX binary using generateProposalDocx,
 * and streams back attachment Response directly.
 */

import type { Env } from '../types';
import { apiError } from '../types';
import { generateProposalDocx, ProposalDocData, ProposalPricingItem, ProposalSectionData } from '../lib/docx';

interface ProposalRow {
  id: string;
  org_id?: string;
  title: string;
  client_name: string;
  content?: string;
  value?: number;
  currency?: string;
  created_at?: string;
}

interface ProposalSectionRow {
  id: string;
  proposal_id: string;
  section_type?: string;
  title: string;
  content: string;
  order_index: number;
}

export async function handleExportDocx(
  request: Request,
  env: Env,
  proposalId: string
): Promise<Response> {
  try {
    // 1. Load proposal from D1 database
    const proposal = await env.DB.prepare(
      'SELECT id, org_id, title, client_name, content, value, currency, created_at FROM proposals WHERE id = ?'
    ).bind(proposalId).first<ProposalRow>();

    if (!proposal) {
      return apiError(`Proposal not found: ${proposalId}`, 404);
    }

    // 2. Load proposal sections from D1 database
    const sectionsResult = await env.DB.prepare(
      'SELECT id, proposal_id, section_type, title, content, order_index FROM proposal_sections WHERE proposal_id = ? ORDER BY order_index ASC'
    ).bind(proposalId).all<ProposalSectionRow>();

    const sectionRows = sectionsResult.results || [];

    // 3. Build ProposalDocData object
    const sections: ProposalSectionData[] = [];
    let pricing: ProposalPricingItem[] | undefined = undefined;
    let terms: string | undefined = undefined;

    for (const sec of sectionRows) {
      if (sec.section_type === 'pricing') {
        try {
          const parsed = JSON.parse(sec.content);
          if (Array.isArray(parsed)) {
            pricing = parsed;
          } else if (parsed.items && Array.isArray(parsed.items)) {
            pricing = parsed.items;
          } else {
            sections.push({ title: sec.title, content: sec.content });
          }
        } catch {
          sections.push({ title: sec.title, content: sec.content });
        }
      } else if (sec.section_type === 'terms') {
        terms = sec.content;
      } else {
        sections.push({ title: sec.title, content: sec.content });
      }
    }

    if (sections.length === 0 && proposal.content) {
      sections.push({
        title: 'Proposal Overview',
        content: proposal.content,
      });
    }

    let totalValue: string | number | undefined = proposal.value;
    if (proposal.value !== undefined && proposal.value !== null && proposal.currency) {
      totalValue = `${proposal.currency === 'USD' ? '$' : proposal.currency + ' '}${proposal.value.toLocaleString('en-US')}`;
    }

    const docData: ProposalDocData = {
      title: proposal.title || 'Business Proposal',
      client_name: proposal.client_name || 'Valued Client',
      created_at: proposal.created_at,
      sections,
      pricing,
      total_value: totalValue,
      terms,
    };

    // 4. Generate DOCX file bytes
    const docxBytes = await generateProposalDocx(docData);

    const safeTitle = (proposal.title || 'proposal')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');

    // 5. Return Response with attachment headers
    return new Response(docxBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${safeTitle}.docx"`,
        'Content-Length': docxBytes.length.toString(),
      },
    });
  } catch (err) {
    console.error('Error generating proposal DOCX export:', err);
    return apiError(`Failed to generate DOCX export: ${err instanceof Error ? err.message : String(err)}`, 500);
  }
}
