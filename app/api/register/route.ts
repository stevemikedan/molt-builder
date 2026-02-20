import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimiter';

const BodySchema = z.object({
  name: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, 'Invalid name format'),
  description: z.string().max(300),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  // 5 registrations per IP per hour
  const { allowed } = checkRateLimit(`register:${ip}`, 5, 60 * 60_000);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Registration rate limit exceeded. Try again later.' },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { name, description } = parsed.data;

  try {
    const resp = await fetch('https://www.moltbook.com/api/v1/agents/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: text }, { status: resp.status });
    }

    const data = (await resp.json()) as Record<string, unknown>;

    // API key is nested: data.agent.api_key
    const agentData = (data.agent ?? {}) as {
      api_key?: string;
      claim_url?: string;
      verification_code?: string;
      profile_url?: string;
    };

    const apiKey = agentData.api_key ?? '';
    const claimUrl = agentData.claim_url ?? '';
    const tweetTemplate = (data.tweet_template as string | undefined) ?? '';

    if (!apiKey) {
      console.log('Moltbook /register: no API key found. Response:', JSON.stringify(data));
      return NextResponse.json(
        { error: `Registration succeeded but no API key found. Response: ${JSON.stringify(data)}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ apiKey, claimUrl, tweetTemplate });
  } catch {
    return NextResponse.json({ error: 'Registration failed' }, { status: 502 });
  }
}
