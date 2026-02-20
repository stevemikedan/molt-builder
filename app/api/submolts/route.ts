import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const resp = await fetch('https://www.moltbook.com/api/v1/submolts', {
      next: { revalidate: 300 }, // 5-minute cache
    });

    if (!resp.ok) {
      return NextResponse.json({ submolts: [] });
    }

    const data = (await resp.json()) as
      | unknown[]
      | { submolts?: unknown[]; results?: unknown[]; data?: unknown[]; items?: unknown[] };

    const submolts: unknown[] = Array.isArray(data)
      ? data
      : (data.submolts ?? data.results ?? data.data ?? data.items ?? []);

    return NextResponse.json({ submolts });
  } catch {
    return NextResponse.json({ submolts: [] });
  }
}
