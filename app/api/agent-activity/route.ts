import { NextRequest, NextResponse } from 'next/server';

const BASE = 'https://www.moltbook.com/api/v1';

async function moltGet(path: string, apiKey: string): Promise<Record<string, unknown> | null> {
  try {
    const resp = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return typeof data === 'object' && !Array.isArray(data) ? data : { _raw: data };
  } catch {
    return null;
  }
}

/**
 * GET /api/agent-activity?name=ExuvianShell
 * Header: x-moltbook-key: <moltbook api key>
 *
 * Fetches live status and profile data from Moltbook.
 * Note: Moltbook's public API does not expose post/comment history endpoints.
 * Stats (karma, post count) come from /agents/me and /agents/status.
 */
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-moltbook-key') ?? '';

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 400 });
  }

  const [statusData, profileData] = await Promise.all([
    moltGet('/agents/status', apiKey),
    moltGet('/agents/me', apiKey),
  ]);

  return NextResponse.json({
    status: statusData,
    profile: profileData,
  });
}
