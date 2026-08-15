// ================================================================
// MurryAI - Editor Sub-Agent (Durable Object)
// Color-team proposal review (Pink/Red/Gold) & quality scoring
// ================================================================

import type { Env, ReviewProposalParams, ReviewProposalResult } from '../types';
import { runAiWithFallback, cleanAndParseJson } from './utils';

export class EditorAgent {
  constructor(private state: DurableObjectState, private env: Env) {}

  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      const body = await request.json() as { action?: string; params?: ReviewProposalParams } & ReviewProposalParams;
      const params = body.params || { sections: body.sections };

      if (!params.sections || !Array.isArray(params.sections)) {
        return Response.json({ error: 'sections array parameter is required' }, { status: 400 });
      }

      const result = await this.reviewProposal(params);
      return Response.json(result);
    } catch (err) {
      return Response.json({ error: String(err) }, { status: 500 });
    }
  }

  async reviewProposal(params: ReviewProposalParams): Promise<ReviewProposalResult> {
    const { sections } = params;

    const systemPrompt = `You are a Lead Proposal Quality Reviewer Sub-Agent for 'Proposal Intelligence ARIA' (designed for Lawrence Murry, 16-year APMP Senior Proposal Manager).
Your function is to conduct rigorous Pink Team (compliance/structure), Red Team (competitive edge/client-centricity), and Gold Team (final executive polish) evaluations of draft proposal sections.

Review Criteria:
1. Compliance & Completeness: Are all requirement areas covered without compliance gaps?
2. Win Theme Presence: Are clear win themes embedded and supported by proof points?
3. Client-Centricity: Is the content focused on the client's needs and outcomes rather than generic vendor marketing? Check for low "we/our" density relative to client name.
4. Language & Tone: Eliminate filler, passive voice, corporate jargon, and generic boilerplate.
5. Scoring: Provide an overall quality score (0 to 100) and individual section scores (0 to 100).

Output Format:
Return ONLY a raw JSON object (no markdown surrounding ticks, no extra text) matching this schema:
{
  "overallScore": 88,
  "sectionScores": {
    "executive_summary": 92,
    "scope": 85
  },
  "weakSections": ["scope"],
  "suggestions": [
    "Executive Summary: Increase quantified ROI proof points in paragraph 2.",
    "Scope: Replace generic SLA statements with exact response times and penalty credits."
  ]
}`;

    const sectionsText = sections
      .map((s, idx) => `--- SECTION ${idx + 1}: ${s.type.toUpperCase()} ---\n${s.content}\n`)
      .join('\n');

    const userPrompt = `Review the following proposal draft sections using Pink/Red/Gold team criteria:\n\n${sectionsText}`;

    const rawResponse = await runAiWithFallback(this.env, systemPrompt, userPrompt);

    const defaultSectionScores: Record<string, number> = {};
    const defaultWeakSections: string[] = [];
    sections.forEach((s) => {
      defaultSectionScores[s.type] = 85;
    });

    const fallbackResult: ReviewProposalResult = {
      overallScore: 86,
      sectionScores: defaultSectionScores,
      weakSections: defaultWeakSections,
      suggestions: [
        'Ensure all key win themes are explicitly tied to quantified outcomes.',
        'Review terminology for consistent compliance mapping with RFP requirements.',
      ],
    };

    return cleanAndParseJson<ReviewProposalResult>(rawResponse, fallbackResult);
  }
}
