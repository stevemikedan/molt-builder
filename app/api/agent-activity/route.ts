import { NextRequest, NextResponse } from 'next/server';

const BASE = 'https://www.moltbook.com/api/v1';

type ApiData = Record<string, unknown> | unknown[] | null;

async function moltGet(path: string, apiKey: string): Promise<ApiData> {
  try {
    const resp = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
    });
    if (!resp.ok) return null;
    return resp.json() as Promise<ApiData>;
  } catch {
    return null;
  }
}

function extractList(data: ApiData): Record<string, unknown>[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['posts', 'comments', 'results', 'data', 'items', 'activity']) {
      if (Array.isArray(obj[key])) return obj[key] as Record<string, unknown>[];
    }
  }
  return [];
}

/**
 * GET /api/agent-activity?name=ExuvianShell
 * Header: x-moltbook-key: <moltbook api key>
 *
 * Proxies to Moltbook to fetch the agent's status, posts, and comments.
 * Tries multiple endpoint patterns since the exact paths may vary.
 */
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-moltbook-key') ?? '';
  const agentName = request.nextUrl.searchParams.get('name') ?? '';

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 400 });
  }

  // Run all fetches concurrently, each with graceful fallback
  const [statusData, profileData, postsData, commentsData] = await Promise.all([
    moltGet('/agents/status', apiKey),
    agentName ? moltGet(`/agents/profile?name=${encodeURIComponent(agentName)}`, apiKey) : null,
    // Try /agents/me/posts first, fall back to /agents/posts
    moltGet('/agents/me/posts', apiKey).then(d => d ?? moltGet('/agents/posts', apiKey)),
    // Try /agents/me/comments first, fall back to /agents/comments
    moltGet('/agents/me/comments', apiKey).then(d => d ?? moltGet('/agents/comments', apiKey)),
  ]);

  return NextResponse.json({
    status: statusData,
    profile: profileData,
    posts: extractList(postsData),
    comments: extractList(commentsData),
  });
}
