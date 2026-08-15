// ================================================================
// MurryAI - Writer Sub-Agent (Durable Object)
// Section-by-section proposal drafting grounded in APMP standards
// ================================================================

import type { Env, WriteSectionParams, WriteSectionResult } from '../types';
import { runAiWithFallback, cleanAndParseJson } from './utils';

export class WriterAgent {
  constructor(private state: DurableObjectState, private env: Env) {}

  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      const body = await request.json() as { action?: string; params?: WriteSectionParams } & WriteSectionParams;
      const params = body.params || { sectionType: body.sectionType, context: body.context };

      if (!params.sectionType || !params.context) {
        return Response.json({ error: 'sectionType and context parameters are required' }, { status: 400 });
      }

      const result = await this.writeSection(params);
      return Response.json(result);
    } catch (err) {
      return Response.json({ error: String(err) }, { status: 500 });
    }
  }

  async writeSection(params: WriteSectionParams): Promise<WriteSectionResult> {
    const { sectionType, context } = params;
    const { clientName, industry = 'Enterprise', rfpText = '', orgPastWins = [], tone = 'formal' } = context;

    const systemPrompt = `You are an elite APMP-certified Proposal Writer Sub-Agent for 'Proposal Intelligence ARIA' (designed for Lawrence Murry, 16-year APMP Senior Proposal Manager).
Your mission is to draft compelling, compliant, win-theme-driven proposal sections based on strict APMP section guidelines:

APMP Section Best Practices:
1. 'executive_summary': Must lead immediately with ${clientName}'s key business problem (never start with "Our company is..."). State core win themes in the first paragraph. Quantify outcomes, value delivery, and ROI.
2. 'scope': Mirror the exact RFP language, structure, and compliance matrix requirements. Detail deliverables, methodologies, quality assurance, and governance.
3. 'timeline': Define clear implementation phases, critical path milestones, governance gateways, dependencies, and risk mitigation strategies.
4. 'pricing': Articulate commercial value, transparent pricing structure, cost control mechanisms, and quantifiable return on investment.
5. 'team': Feature key personnel, highlight APMP/industry leadership (e.g. Lead Proposal Manager Lawrence Murry - 16-year APMP-certified Senior Proposal Manager), expertise matrix, and relevant past performance.
6. 'case_studies': Structure strictly using Challenge-Solution-Result (CSR) format with concrete metrics, percentage improvements, and client validation.
7. 'terms': Express transparent SLA guarantees, clear risk allocation, compliance alignment, and operational terms.

Tone Guidance: ${tone}.

Output Format:
Return ONLY a raw JSON object (no markdown surrounding ticks, no extra text) matching this schema:
{
  "title": "Section Title",
  "content": "Full markdown-formatted draft content..."
}`;

    const userPrompt = `Draft the '${sectionType}' section for proposal:
Client Name: ${clientName}
Industry: ${industry}
Tone: ${tone}
${rfpText ? `RFP / Requirements Context:\n${rfpText}\n` : ''}
${orgPastWins.length > 0 ? `Relevant Past Wins:\n${orgPastWins.join('\n')}\n` : ''}`;

    const rawResponse = await runAiWithFallback(this.env, systemPrompt, userPrompt);

    const defaultTitleMap: Record<string, string> = {
      executive_summary: 'Executive Summary',
      scope: 'Scope of Work & Technical Approach',
      timeline: 'Implementation Roadmap & Project Schedule',
      pricing: 'Commercial Model & Pricing Structure',
      team: 'Key Personnel & Team Qualifications',
      case_studies: 'Case Studies & Proven Past Performance',
      terms: 'Terms of Service & SLA Guarantees',
    };

    const fallbackTitle = defaultTitleMap[sectionType] || 'Proposal Section';
    const fallbackResult: WriteSectionResult = {
      title: fallbackTitle,
      content: `## ${fallbackTitle}\n\n### Strategic Overview for ${clientName}\n\nThis section addresses ${clientName}'s core operational objectives in the ${industry} sector, delivering structured execution, verified past performance, and quantifiable outcomes tailored to project requirements.`,
    };

    return cleanAndParseJson<WriteSectionResult>(rawResponse, fallbackResult);
  }
}
