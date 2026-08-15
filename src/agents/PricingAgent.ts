// ================================================================
// MurryAI - Pricing Sub-Agent (Durable Object)
// Commercial strategy & win-rate-optimized tiering
// ================================================================

import type { Env, SuggestPricingParams, SuggestPricingResult } from '../types';
import { runAiWithFallback, cleanAndParseJson } from './utils';

export class PricingAgent {
  constructor(private state: DurableObjectState, private env: Env) {}

  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      const body = await request.json() as { action?: string; params?: SuggestPricingParams } & SuggestPricingParams;
      const params = body.params || { serviceType: body.serviceType, scope: body.scope, historicalDeals: body.historicalDeals };

      if (!params.serviceType || !params.scope) {
        return Response.json({ error: 'serviceType and scope parameters are required' }, { status: 400 });
      }

      const result = await this.suggestPricing(params);
      return Response.json(result);
    } catch (err) {
      return Response.json({ error: String(err) }, { status: 500 });
    }
  }

  async suggestPricing(params: SuggestPricingParams): Promise<SuggestPricingResult> {
    const { serviceType, scope, historicalDeals = [] } = params;

    const systemPrompt = `You are a Commercial Strategy & Pricing Intelligence Sub-Agent for 'Proposal Intelligence ARIA' (designed for Lawrence Murry, 16-year APMP Senior Proposal Manager).
Your mission is to structure 2 to 3 optimized pricing tiers (e.g. Standard / Premier / Enterprise or Essential / Advanced / Strategic) with strategic win-rate-vs-margin tradeoffs.

Pricing Strategy Guidelines:
1. Analyze service type and scope to calculate baseline and premium option tiers.
2. Incorporate historical deal win rates if provided to identify sweet spots where competitive win probability maximizes without sacrificing margin.
3. Provide crisp strategic reasoning explaining why the suggested pricing structure optimizes win probability and lifetime contract value.

Output Format:
Return ONLY a raw JSON object (no markdown surrounding ticks, no extra text) matching this schema:
{
  "suggestedTiers": [
    {
      "name": "Standard / Essential",
      "price": 45000,
      "description": "Core baseline implementation covering essential deliverables and standard SLA."
    },
    {
      "name": "Professional / Premier",
      "price": 75000,
      "description": "Comprehensive scope with accelerated timeline, dedicated manager, and 24/7 priority support."
    },
    {
      "name": "Strategic / Enterprise",
      "price": 120000,
      "description": "Full-scale enterprise deployment with custom integration, continuous optimization, and executive steering."
    }
  ],
  "reasoning": "Detailed analysis of win-rate tradeoffs, historical deal benchmarks, and price sensitivity..."
}`;

    const historicalSummary = historicalDeals.length > 0
      ? `Historical Deal Data (${historicalDeals.length} deals):\n` +
        historicalDeals.map((d, i) => ` - Deal ${i + 1}: $${d.value.toLocaleString()} | Status: ${d.won ? 'WON' : 'LOST'}`).join('\n')
      : 'No historical deal data provided. Use enterprise industry benchmarks.';

    const userPrompt = `Generate pricing recommendations for:
Service Type: ${serviceType}
Scope Summary: ${scope}

${historicalSummary}`;

    const rawResponse = await runAiWithFallback(this.env, systemPrompt, userPrompt);

    const fallbackResult: SuggestPricingResult = {
      suggestedTiers: [
        {
          name: 'Core Baseline',
          price: 50000,
          description: 'Standard implementation covering core scope requirements and business hours support.',
        },
        {
          name: 'Premier Value',
          price: 85000,
          description: 'Recommended option: Complete scope with accelerated deployment, premium SLA, and ongoing advisory.',
        },
        {
          name: 'Enterprise Strategic',
          price: 135000,
          description: 'Turnkey enterprise solution with custom integrations, 24/7 dedicated response, and executive governance.',
        },
      ],
      reasoning: 'Tier structure balances competitive win-probability in RFP evaluations while capturing upsell margin across service delivery options.',
    };

    return cleanAndParseJson<SuggestPricingResult>(rawResponse, fallbackResult);
  }
}
