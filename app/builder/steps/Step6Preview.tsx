'use client';

import { useState } from 'react';
import { CharacterConfig } from '@/types/character';
import { PreviewPost } from '@/components/PreviewPost';

interface Props {
  config: CharacterConfig;
  userApiKey: string;
  setUserApiKey: (key: string) => void;
}

type Status = 'idle' | 'loading' | 'done' | 'error' | 'rate_limited';

export function Step6Preview({ config, userApiKey, setUserApiKey }: Props) {
  const [posts, setPosts] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [showKey, setShowKey] = useState(false);

  const usingOwnKey = userApiKey.trim().length > 0;

  async function handleGenerate() {
    setStatus('loading');
    setErrorMsg('');
    setPosts([]);

    // Strip Moltbook credentials — never sent to preview
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { moltbookApiKey, claimUrl, ...safeConfig } = config;

    try {
      const resp = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...safeConfig,
          // Only include if the user actually entered one
          ...(usingOwnKey ? { userApiKey: userApiKey.trim() } : {}),
        }),
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
          See how your agent will write before deploying. Posts are generated against
          stub Moltbook feed scenarios.
        </p>
      </div>

      {/* API key input */}
      <div className="flex flex-col gap-2 p-4 rounded-xl border border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700" htmlFor="userApiKey">
            Anthropic API key{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          {usingOwnKey && (
            <span className="text-xs text-green-600 font-medium">✓ Using your key · Sonnet</span>
          )}
          {!usingOwnKey && (
            <span className="text-xs text-gray-400">Using shared key · Haiku</span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            id="userApiKey"
            type={showKey ? 'text' : 'password'}
            value={userApiKey}
            onChange={e => setUserApiKey(e.target.value)}
            placeholder="sk-ant-… (paste to use your own key)"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <button
            onClick={() => setShowKey(v => !v)}
            className="px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white hover:bg-gray-50"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Your key is sent only for this preview call and never stored.
          Without a key, we generate a quick sample using a shared Haiku model.
        </p>
      </div>

      <button
        onClick={handleGenerate}
        disabled={status === 'loading'}
        className="self-start px-5 py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {status === 'loading'
          ? 'Generating…'
          : status === 'done'
            ? 'Regenerate'
            : 'Generate Sample Posts'}
      </button>

      {(status === 'error' || status === 'rate_limited') && (
        <p className="text-sm text-red-500">{errorMsg}</p>
      )}

      {status === 'done' && posts.length === 0 && (
        <p className="text-sm text-gray-400">
          No posts generated. Try adjusting your persona or voice rules.
        </p>
      )}

      {posts.length > 0 && (
        <div className="flex flex-col gap-3">
          {posts.map((post, i) => (
            <PreviewPost key={i} agentName={config.name} content={post} index={i} />
          ))}
          <p className="text-xs text-gray-400">
            Samples from stub feed contexts — real posts will vary based on live Moltbook content.
            {!usingOwnKey && ' Using shared Haiku model; add your key above for higher-quality previews.'}
          </p>
        </div>
      )}
    </div>
  );
}
