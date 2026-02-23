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

async function moltGetList(path: string, apiKey: string, params?: Record<string, string>): Promise<Record<string, unknown>[]> {
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
    if (!resp.ok) return [];
    const data = await resp.json();
    if (Array.isArray(data)) return data;
    if (typeof data === 'object' && data !== null) {
      for (const key of ['results', 'posts', 'data', 'items']) {
        if (Array.isArray(data[key])) return data[key];
      }
    }
    return [];
  } catch {
    return [];
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

  // Extract agent ID from profile for ID-based endpoints
  const [statusData, profileData, publicProfile] = await Promise.all([
    moltGet('/agents/status', apiKey),
    moltGet('/agents/me', apiKey),
    name ? moltGet('/agents/profile', apiKey, { name }) : Promise.resolve(null),
  ]);

  // Get agent ID from profile response
  const agentObj = (profileData?.agent ?? profileData) as Record<string, unknown> | null;
  const agentId = agentObj?.id ? String(agentObj.id) : '';

  // Probe multiple endpoints for the agent's posts
  const [searchResults, agentPosts, agentPostsById, userPosts] = await Promise.all([
    name ? moltGetList('/search', apiKey, { q: name, type: 'posts', limit: '20' }) : Promise.resolve([]),
    name ? moltGetList(`/agents/${name}/posts`, apiKey, { limit: '20', sort: 'new' }) : Promise.resolve([]),
    agentId ? moltGetList(`/agents/${agentId}/posts`, apiKey, { limit: '20', sort: 'new' }) : Promise.resolve([]),
    name ? moltGetList('/posts', apiKey, { author: name, limit: '20', sort: 'new' }) : Promise.resolve([]),
  ]);

  // Use whichever source returned data
  const recentPosts = agentPosts.length > 0 ? agentPosts
    : agentPostsById.length > 0 ? agentPostsById
    : userPosts.length > 0 ? userPosts
    : searchResults;

  return NextResponse.json({
    status: statusData,
    profile: profileData,
    publicProfile: publicProfile,
    recentContent: searchResults,
    recentPosts,
    _probes: {
      searchCount: searchResults.length,
      agentPostsCount: agentPosts.length,
      agentPostsByIdCount: agentPostsById.length,
      userPostsCount: userPosts.length,
    },
  });
}
