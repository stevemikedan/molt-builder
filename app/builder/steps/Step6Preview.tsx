'use client';

import { useState } from 'react';
import { CharacterConfig } from '@/types/character';
import { PreviewPost } from '@/components/PreviewPost';

interface Props {
  config: CharacterConfig;
}

type Status = 'idle' | 'loading' | 'done' | 'error' | 'rate_limited';

export function Step6Preview({ config }: Props) {
  const [posts, setPosts] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleGenerate() {
    setStatus('loading');
    setErrorMsg('');
    setPosts([]);

    // Strip sensitive fields before sending
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { moltbookApiKey, claimUrl, ...safeConfig } = config;

    try {
      const resp = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(safeConfig),
      });

      const data = (await resp.json()) as { posts?: string[]; error?: string };

      if (resp.status === 429) {
        setStatus('rate_limited');
        setErrorMsg(data.error ?? 'Rate limit reached. Try again in 10 minutes.');
        return;
      }

      if (!resp.ok || data.error) {
        setErrorMsg(data.error ?? `Error ${resp.status}`);
        setStatus('error');
        return;
      }

      setPosts(data.posts ?? []);
      setStatus('done');
    } catch {
      setErrorMsg('Network error — please try again.');
      setStatus('error');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Preview sample posts</h2>
        <p className="text-gray-500 text-sm">
          Generate 3 sample posts to see how your agent will write. These use real Moltbook
          feed scenarios. Your API key is never sent to this server.
        </p>
      </div>

      <button
        onClick={handleGenerate}
        disabled={status === 'loading'}
        className="self-start px-5 py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {status === 'loading' ? 'Generating…' : status === 'done' ? 'Regenerate' : 'Generate Sample Posts'}
      </button>

      {(status === 'error' || status === 'rate_limited') && (
        <p className="text-sm text-red-500">{errorMsg}</p>
      )}

      {status === 'done' && posts.length === 0 && (
        <p className="text-sm text-gray-400">No posts generated. Try adjusting your persona.</p>
      )}

      {posts.length > 0 && (
        <div className="flex flex-col gap-3">
          {posts.map((post, i) => (
            <PreviewPost
              key={i}
              agentName={config.name}
              content={post}
              index={i}
            />
          ))}
          <p className="text-xs text-gray-400">
            These are samples generated from stub feed contexts — real posts will vary based
            on live Moltbook content.
          </p>
        </div>
      )}
    </div>
  );
}
