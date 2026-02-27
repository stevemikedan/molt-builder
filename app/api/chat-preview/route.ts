import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimiter';
import { CharacterConfigSchema } from '@/types/character';
import { buildSystemPrompt } from '@/lib/buildSystemPrompt';

// ── Provider configs ────────────────────────────────────────────────────────

interface ProviderConfig {
  baseUrl: string;
  model: string;
}

const OPENAI_PROVIDERS: Record<string, ProviderConfig> = {
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

const PROVIDER_IDS = ['anthropic', ...Object.keys(OPENAI_PROVIDERS)] as const;

// ── Anthropic fallback settings ─────────────────────────────────────────────

const FALLBACK_MODEL = 'claude-haiku-4-5-20251001';
const USER_ANTHROPIC_MODEL = 'claude-sonnet-4-6';

// ── Schema ──────────────────────────────────────────────────────────────────

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000),
});

const ChatPreviewBodySchema = z.object({
  config: CharacterConfigSchema.omit({ moltbookApiKey: true, claimUrl: true }),
  messages: z.array(MessageSchema).min(1).max(50),
  userApiKey: z.string().optional(),
  provider: z.enum(PROVIDER_IDS as unknown as [string, ...string[]]).optional(),
});

const CHAT_SUFFIX =
  '\n\nYou are now in a direct conversation with your owner/creator. ' +
  'Respond naturally in your voice. Keep responses concise but thoughtful. ' +
  'You are not writing a post — you are having a conversation.';

// ── OpenAI-compatible call via fetch ────────────────────────────────────────

async function callOpenAICompatible(
  apiKey: string,
  providerKey: string,
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
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
      temperature: 0.8,
      max_tokens: 1024,
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

// ── Route handler ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const { allowed } = checkRateLimit(`chat-preview:${ip}`, 20, 10 * 60_000);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Chat rate limit reached. Try again in a few minutes.' },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Strip secrets from config if present
  if (body && typeof body === 'object' && 'config' in body) {
    const cfg = (body as Record<string, unknown>).config;
    if (cfg && typeof cfg === 'object') {
      const c = cfg as Record<string, unknown>;
      delete c.moltbookApiKey;
      delete c.claimUrl;
    }
  }

  const parsed = ChatPreviewBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { config, messages, userApiKey, provider } = parsed.data;
  const systemPrompt = buildSystemPrompt(config) + CHAT_SUFFIX;
  const msgs = messages.map(m => ({ role: m.role, content: m.content }));

  // ── User supplied a key + non-Anthropic provider → OpenAI-compatible ────
  if (userApiKey?.trim() && provider && provider !== 'anthropic') {
    try {
      const text = await callOpenAICompatible(userApiKey.trim(), provider, systemPrompt, msgs);
      return NextResponse.json({ response: text });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      if (msg === 'AUTH_ERROR') {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
      }
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // ── Anthropic path (user key or fallback env key) ─────────────────────
  const resolvedKey = userApiKey?.trim() || process.env.ANTHROPIC_API_KEY;
  const resolvedModel = userApiKey?.trim() ? USER_ANTHROPIC_MODEL : FALLBACK_MODEL;

  if (!resolvedKey) {
    return NextResponse.json({ error: 'Chat preview unavailable' }, { status: 503 });
  }

  const client = new Anthropic({ apiKey: resolvedKey });

  try {
    const response = await client.messages.create({
      model: resolvedModel,
      system: systemPrompt,
      max_tokens: 1024,
      temperature: 0.8,
      messages: msgs,
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text.trim() : '';

    return NextResponse.json({ response: text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Generation failed';
    if (msg.includes('invalid x-api-key') || msg.includes('authentication')) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
