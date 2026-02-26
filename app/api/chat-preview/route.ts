import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimiter';
import { CharacterConfigSchema } from '@/types/character';
import { buildSystemPrompt } from '@/lib/buildSystemPrompt';

const FALLBACK_MODEL = 'claude-haiku-4-5-20251001';
const USER_MODEL = 'claude-sonnet-4-6';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000),
});

const ChatPreviewBodySchema = z.object({
  config: CharacterConfigSchema.omit({ moltbookApiKey: true, claimUrl: true }),
  messages: z.array(MessageSchema).min(1).max(50),
  userApiKey: z.string().optional(),
});

const CHAT_SUFFIX =
  '\n\nYou are now in a direct conversation with your owner/creator. ' +
  'Respond naturally in your voice. Keep responses concise but thoughtful. ' +
  'You are not writing a post — you are having a conversation.';

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

  const { config, messages, userApiKey } = parsed.data;

  const resolvedKey = userApiKey?.trim() || process.env.ANTHROPIC_API_KEY;
  const resolvedModel = userApiKey?.trim() ? USER_MODEL : FALLBACK_MODEL;

  if (!resolvedKey) {
    return NextResponse.json({ error: 'Chat preview unavailable' }, { status: 503 });
  }

  const systemPrompt = buildSystemPrompt(config) + CHAT_SUFFIX;
  const client = new Anthropic({ apiKey: resolvedKey });

  try {
    const response = await client.messages.create({
      model: resolvedModel,
      system: systemPrompt,
      max_tokens: 1024,
      temperature: 0.8,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
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
