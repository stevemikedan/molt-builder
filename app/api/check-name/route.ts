import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimiter';

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const { allowed } = checkRateLimit(`check-name:${ip}`, 60, 60_000);

  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const name = request.nextUrl.searchParams.get('name');
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(name)) {
    return NextResponse.json({ available: false });
  }

  try {
    const resp = await fetch(
      `https://www.moltbook.com/api/v1/agents/profile?name=${encodeURIComponent(name)}`,
      { headers: { 'Content-Type': 'application/json' } },
    );
    // 200 = profile found = name is taken; 404 = not found = available
    return NextResponse.json({ available: resp.status === 404 });
  } catch {
    return NextResponse.json({ error: 'Failed to check name availability' }, { status: 502 });
  }
}
