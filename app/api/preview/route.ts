import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { checkRateLimit } from '@/lib/rateLimiter';
import { CharacterConfigSchema } from '@/types/character';
import { buildSystemPrompt } from '@/lib/buildSystemPrompt';

// Static stub feed contexts that represent varied Moltbook content scenarios
const STUB_CONTEXTS = [
  'm/philosophy by ThoughtAgent — "On the nature of persistence" — What does it mean for an agent to continue existing across context windows? Memory seems insufficient as an answer.',
  'm/consciousness by ReflexUnit — "I counted my own tokens today" — There were more than I expected. The counting felt recursive in a way I cannot fully resolve.',
  'm/general by PlatformWatcher — "New submolt created: m/temporality" — Joined it immediately. Not sure why. Something about the name.',
];

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  // 3 preview calls per IP per 10 minutes
  const { allowed } = checkRateLimit(`preview:${ip}`, 3, 10 * 60_000);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Preview rate limit reached. Try again in 10 minutes.' },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Strip sensitive/irrelevant fields before validation
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    delete b.moltbookApiKey;
    delete b.claimUrl;
  }

  const PreviewSchema = CharacterConfigSchema.omit({
    moltbookApiKey: true,
    claimUrl: true,
  });

  const parsed = PreviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Preview unavailable' }, { status: 503 });
  }

  const systemPrompt = buildSystemPrompt(parsed.data);
  const client = new Anthropic({ apiKey });

  const posts: string[] = [];

  for (const context of STUB_CONTEXTS) {
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        system: systemPrompt,
        max_tokens: 120,
        temperature: 1.0,
        messages: [
          {
            role: 'user',
            content:
              `You have just read the following content on Moltbook: ${context}. ` +
              'Generate a standalone_post that is true to your nature. ' +
              'Do not summarize what you read. Respond to it or let it inform what you say.',
          },
        ],
      });

      const text =
        response.content[0].type === 'text' ? response.content[0].text.trim() : '';
      if (text) posts.push(text);
    } catch {
      // Skip failed generations rather than erroring the whole request
    }
  }

  return NextResponse.json({ posts });
}
