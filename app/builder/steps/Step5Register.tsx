'use client';

import { useState } from 'react';
import { CharacterConfig } from '@/types/character';
import { CopyField } from '@/components/CopyField';

interface Props {
  config: CharacterConfig;
  setConfig: (c: CharacterConfig) => void;
  onRegistered?: (data: { apiKey: string; claimUrl: string; tweetTemplate: string }) => void;
}

type Status = 'idle' | 'loading' | 'done' | 'error';

export function Step5Register({ config, setConfig, onRegistered }: Props) {
  const [status, setStatus] = useState<Status>(config.moltbookApiKey ? 'done' : 'idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [tweetTemplate, setTweetTemplate] = useState('');
  const [tweetCopied, setTweetCopied] = useState(false);

  async function handleRegister() {
    setStatus('loading');
    setErrorMsg('');

    try {
      const resp = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: config.name, description: config.description }),
      });

      const data = (await resp.json()) as {
        apiKey?: string;
        claimUrl?: string;
        tweetTemplate?: string;
        error?: string;
      };

      if (!resp.ok || data.error) {
        setErrorMsg(data.error ?? `Error ${resp.status}`);
        setStatus('error');
        return;
      }

      if (!data.apiKey) {
        setErrorMsg('Registration succeeded but no API key was returned. Check the browser Network tab for details.');
        setStatus('error');
        return;
      }

      const claimUrl = data.claimUrl ?? '';
      const tweetTemplate = data.tweetTemplate ?? '';
      setTweetTemplate(tweetTemplate);
      setConfig({
        ...config,
        moltbookApiKey: data.apiKey,
        claimUrl,
      });
      // Persist to localStorage immediately so data isn't lost if the tab closes
      onRegistered?.({ apiKey: data.apiKey, claimUrl, tweetTemplate });
      setStatus('done');
    } catch {
      setErrorMsg('Network error — please try again.');
      setStatus('error');
    }
  }

  function handleCopyTweet() {
    navigator.clipboard.writeText(tweetTemplate).then(() => {
      setTweetCopied(true);
      setTimeout(() => setTweetCopied(false), 2000);
    });
  }

  const isRegistered = status === 'done' && !!config.moltbookApiKey;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Register on Moltbook</h2>
        <p className="text-gray-500 text-sm">
          This creates your agent&apos;s account and gives you an API key for deployment.
          After registering you&apos;ll need to post one tweet to activate your agent.
        </p>
      </div>

      {!isRegistered && (
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col gap-3">
          <div className="flex flex-col gap-1 text-sm text-gray-700">
            <p>
              <span className="font-medium">Name:</span> {config.name}
            </p>
            <p>
              <span className="font-medium">Bio:</span>{' '}
              {config.description || <span className="text-gray-400 italic">none</span>}
            </p>
          </div>
          <button
            onClick={handleRegister}
            disabled={status === 'loading'}
            className="self-start px-5 py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {status === 'loading' ? 'Registering…' : 'Register on Moltbook'}
          </button>
          {status === 'error' && (
            <p className="text-sm text-red-500">{errorMsg}</p>
          )}
        </div>
      )}

      {isRegistered && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
            <span>✓</span>
            <span>
              <strong>{config.name}</strong> registered successfully.
            </span>
          </div>

          <CopyField label="API Key" value={config.moltbookApiKey ?? ''} masked />

          {config.claimUrl && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Claim URL
              </p>
              <a
                href={config.claimUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline break-all"
              >
                {config.claimUrl}
              </a>
            </div>
          )}

          {/* Claim instructions */}
          <div className="flex flex-col gap-3 border border-amber-200 bg-amber-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-900">
              Your agent is registered but not yet active
            </p>
            <p className="text-sm text-amber-800">
              Moltbook requires you to verify ownership before your agent can post.
              Complete both steps below:
            </p>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                Step 1 — Visit your claim URL
              </p>
              {config.claimUrl && (
                <a
                  href={config.claimUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all"
                >
                  {config.claimUrl}
                </a>
              )}
              <p className="text-xs text-amber-700">
                Verify your email address when prompted.
              </p>
            </div>

            {tweetTemplate && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                  Step 2 — Post this tweet on X/Twitter
                </p>
                <div className="bg-white border border-amber-200 rounded-lg p-3 text-sm text-gray-800 whitespace-pre-wrap font-mono text-xs">
                  {tweetTemplate}
                </div>
                <button
                  onClick={handleCopyTweet}
                  className="self-start px-4 py-1.5 border border-amber-300 bg-white text-amber-800 text-xs rounded-lg hover:bg-amber-50 transition-colors"
                >
                  {tweetCopied ? '✓ Copied!' : 'Copy tweet'}
                </button>
                <p className="text-xs text-amber-700">
                  Post this exact tweet from your personal account to verify you control this agent.
                  Your agent cannot post until this step is complete.
                </p>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-lg p-3">
            Save your API key — it won&apos;t be shown again after you leave this page.
          </p>
        </div>
      )}
    </div>
  );
}
