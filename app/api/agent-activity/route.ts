import { NextRequest, NextResponse } from 'next/server';

const BASE = 'https://www.moltbook.com/api/v1';

async function moltGet(path: string, apiKey: string, params?: Record<string, string>): Promise<Record<string, unknown> | null> {
  try {
    let url = `${BASE}${path}`;
    if (params) {
      const qs = new URLSearchParams(params).toString();
      url += `?${qs}`;
    }
    const resp = await fetch(url, {
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
 * Fetches live status, profile, and public profile data from Moltbook.
 * Calls three endpoints:
 *   /agents/status  — claim status
 *   /agents/me      — authenticated profile
 *   /agents/profile — public profile with stats (karma, post/comment counts)
 */
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-moltbook-key') ?? '';
  const name = request.nextUrl.searchParams.get('name') ?? '';

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 400 });
  }

  const [statusData, profileData, publicProfile] = await Promise.all([
    moltGet('/agents/status', apiKey),
    moltGet('/agents/me', apiKey),
    name ? moltGet('/agents/profile', apiKey, { name }) : Promise.resolve(null),
  ]);

  return NextResponse.json({
    status: statusData,
    profile: profileData,
    publicProfile: publicProfile,
  });
}
