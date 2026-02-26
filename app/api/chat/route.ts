import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy chat requests from the browser to the agent's HTTP server.
 * Avoids CORS issues and keeps the agent's service URL out of the browser.
 *
 * POST — Forward a message to the agent's /chat endpoint
 * GET  — Fetch chat history from the agent's /chat/history endpoint
 *
 * Both expect `serviceUrl` and `apiKey` in query params (GET) or body (POST).
 */

export async function POST(req: NextRequest) {
  let body: { serviceUrl: string; apiKey: string; message: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { serviceUrl, apiKey, message } = body;
  if (!serviceUrl || !message) {
    return NextResponse.json({ error: 'serviceUrl and message are required' }, { status: 400 });
  }

  // Normalize: strip trailing slash
  const base = serviceUrl.replace(/\/+$/, '');

  try {
    const resp = await fetch(`${base}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({ message }),
      signal: AbortSignal.timeout(60_000), // 60s for LLM generation
    });

    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

export async function GET(req: NextRequest) {
  const serviceUrl = req.nextUrl.searchParams.get('serviceUrl');
  const apiKey = req.nextUrl.searchParams.get('apiKey') ?? '';

  if (!serviceUrl) {
    return NextResponse.json({ error: 'serviceUrl query param is required' }, { status: 400 });
  }

  const base = serviceUrl.replace(/\/+$/, '');

  try {
    const resp = await fetch(`${base}/chat/history`, {
      headers: {
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      signal: AbortSignal.timeout(10_000),
    });

    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
