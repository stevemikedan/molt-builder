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

    // Log response shape (keys only, never values) so we can see the field names in Vercel logs
    console.log('Moltbook /register response keys:', Object.keys(data));
    console.log('Moltbook /register status:', resp.status);

    // Normalize field names — handle snake_case and camelCase variants
    const apiKey =
      (data.api_key as string | undefined) ??
      (data.apiKey as string | undefined) ??
      (data.key as string | undefined) ??
      (data.token as string | undefined) ??
      (data.moltbook_api_key as string | undefined) ??
      '';

    const claimUrl =
      (data.claim_url as string | undefined) ??
      (data.claimUrl as string | undefined) ??
      (data.claim_link as string | undefined) ??
      '';

    if (!apiKey) {
      console.log('Moltbook /register: could not find API key in response. Full response:', JSON.stringify(data));
    }

    return NextResponse.json({ apiKey, claimUrl });
  } catch {
    return NextResponse.json({ error: 'Registration failed' }, { status: 502 });
  }
}
