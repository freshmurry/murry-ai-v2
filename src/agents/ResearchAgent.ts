// ================================================================
// MurryAI - Research Sub-Agent (Durable Object)
// Capture-phase intelligence & competitive analysis
// ================================================================

import type { Env, ResearchParams, ResearchResult } from '../types';
import { runAiWithFallback, cleanAndParseJson } from './utils';

export class ResearchAgent {
  constructor(private state: DurableObjectState, private env: Env) {}

  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      const body = await request.json() as { action?: string; params?: ResearchParams } & ResearchParams;
      const params = body.params || { clientName: body.clientName, industry: body.industry };

      if (!params.clientName) {
        return Response.json({ error: 'clientName parameter is required' }, { status: 400 });
      }

      const result = await this.researchClient(params);
      return Response.json(result);
    } catch (err) {
      return Response.json({ error: String(err) }, { status: 500 });
    }
  }

  async researchClient(params: { clientName: string; industry?: string }): Promise<ResearchResult> {
    const { clientName, industry = 'Enterprise & Public Sector' } = params;

    const systemPrompt = `You are an expert APMP-certified Capture Manager and Proposal Research Intelligence Sub-Agent for 'Proposal Intelligence ARIA' (designed for Lawrence Murry, 16-year APMP-certified Senior Proposal Manager).
Your specialty is pre-RFP capture phase intelligence, competitor ghosting, and discriminator identification for government and enterprise proposals.

Methodology Guidelines:
1. Ground your synthesis in APMP capture management standards.
2. Identify strategic discriminators (unique proof points, technological advantages, service delivery models).
3. Frame competitor weaknesses through "ghosting" (highlighting competitor pitfalls indirect-first without explicit derogatory naming, positioning our strengths as the antidote).
4. Analyze macro industry trends and critical procurement/operational risks for the client.

Output Format:
Return ONLY a raw JSON object (no markdown surrounding ticks, no commentary) matching this schema:
{
  "summary": "Executive competitive intelligence and discriminator strategy summary...",
  "competitors": ["Competitor profile 1 with key ghosting strategies...", "Competitor profile 2..."],
  "industryTrends": ["Key industry trend 1...", "Key industry trend 2..."],
  "keyRisks": ["Risk factor 1 and mitigation...", "Risk factor 2..."]
}`;

    const userPrompt = `Perform capture-phase competitive research and strategic discriminator analysis for:
Target Client: ${clientName}
Industry Sector: ${industry}

Provide high-value, action-oriented intelligence to win this proposal.`;

    const rawResponse = await runAiWithFallback(this.env, systemPrompt, userPrompt);

    const fallbackResult: ResearchResult = {
      summary: `Competitive intelligence synthesis for ${clientName} in the ${industry} sector highlighting strategic positioning and APMP capture alignment.`,
      competitors: [
        `Legacy incumbent: Ghost on agile delivery gaps and higher total cost of ownership.`,
        `Niche point solution: Ghost on lack of enterprise scale, security certifications, and SLA backing.`,
      ],
      industryTrends: [
        `Accelerated cloud modernization and AI integration in operational workflows.`,
        `Strict compliance requirements, cybersecurity frameworks, and rigorous vendor risk management.`,
      ],
      keyRisks: [
        `Incomplete requirement mapping leading to scope creep during execution.`,
        `Aggressive transition timelines requiring rapid team onboarding and change management.`,
      ],
    };

    return cleanAndParseJson<ResearchResult>(rawResponse, fallbackResult);
  }
}
