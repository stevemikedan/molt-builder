/**
 * Shared LLM provider configuration.
 *
 * Used by ChatPanel (UI), chat-preview route, and preview route.
 */

export const PROVIDERS = [
  { id: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-...' },
  { id: 'openai',    label: 'OpenAI',    placeholder: 'sk-...' },
  { id: 'gemini',    label: 'Gemini',    placeholder: 'AIza...' },
  { id: 'groq',      label: 'Groq',      placeholder: 'gsk_...' },
  { id: 'xai',       label: 'xAI',       placeholder: 'xai-...' },
  { id: 'deepseek',  label: 'DeepSeek',  placeholder: 'sk-...' },
] as const;

export type ProviderId = (typeof PROVIDERS)[number]['id'];

export const PROVIDER_IDS = PROVIDERS.map(p => p.id) as unknown as [string, ...string[]];

interface ProviderConfig {
  baseUrl: string;
  model: string;
}

export const OPENAI_PROVIDERS: Record<string, ProviderConfig> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.0-flash',
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
  },
  xai: {
    baseUrl: 'https://api.x.ai/v1',
    model: 'grok-3-mini-fast',
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
  },
};

/**
 * Call an OpenAI-compatible chat completions endpoint.
 */
export async function callOpenAICompatible(
  apiKey: string,
  providerKey: string,
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  options?: { temperature?: number; max_tokens?: number },
): Promise<string> {
  const cfg = OPENAI_PROVIDERS[providerKey];
  if (!cfg) throw new Error(`Unknown provider: ${providerKey}`);

  const resp = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      temperature: options?.temperature ?? 0.8,
      max_tokens: options?.max_tokens ?? 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!resp.ok) {
    const body = await resp.text();
    if (resp.status === 401 || resp.status === 403) {
      throw new Error('AUTH_ERROR');
    }
    throw new Error(body || `Provider returned ${resp.status}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}
