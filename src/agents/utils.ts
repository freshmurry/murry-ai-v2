// ================================================================
// MurryAI - Sub-Agent Helpers
// AI execution with primary/fallback models and robust JSON parsing
// ================================================================

import type { Env } from '../types';

export const PRIMARY_MODEL = '@cf/moonshotai/kimi-k2.6';
export const SECONDARY_MODEL = '@cf/moonshotai/kimi-k2.7-code';
export const FALLBACK_MODEL = '@cf/zai-org/glm-4.7-flash';

function extractText(res: unknown): string {
  if (!res) return '';
  if (typeof res === 'string') return res;
  if (typeof res === 'object') {
    const obj = res as Record<string, unknown>;
    if (typeof obj.response === 'string') return obj.response;
    if (obj.result && typeof (obj.result as Record<string, unknown>).response === 'string') {
      return (obj.result as Record<string, unknown>).response as string;
    }
    if (Array.isArray(obj.choices) && obj.choices[0]?.message?.content) {
      return obj.choices[0].message.content as string;
    }
  }
  return JSON.stringify(res);
}

export async function runAiWithFallback(
  env: Env,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const chain: Array<{ name: string; model: string }> = [
    { name: 'primary', model: PRIMARY_MODEL },
    { name: 'secondary', model: SECONDARY_MODEL },
    { name: 'fallback', model: FALLBACK_MODEL },
  ];

  let lastErr: unknown = null;
  for (const step of chain) {
    try {
      const res = await env.AI.run(step.model as never, { messages } as never);
      const text = extractText(res);
      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (err) {
      lastErr = err;
      console.warn(`${step.name} model (${step.model}) failed: ${String(err)}.`);
    }
  }

  throw new Error(
    `AI generation failed on all models (${chain.map((c) => c.model).join(' -> ')}). Last error: ${String(lastErr)}`
  );
}

export function cleanAndParseJson<T>(rawText: string, defaultFallback: T): T {
  let cleaned = rawText.trim();

  // Strip markdown code block wrappers if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/```$/, '').trim();
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Attempt regex extraction for object or array
    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]) as T;
      } catch {
        // Ignore
      }
    }

    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]) as T;
      } catch {
        // Ignore
      }
    }
  }

  return defaultFallback;
}
