'use client';

import { useState } from 'react';
import { CharacterConfig } from '@/types/character';
import { CopyField } from '@/components/CopyField';

interface Props {
  config: CharacterConfig;
  setConfig: (c: CharacterConfig) => void;
}

type Status = 'idle' | 'loading' | 'done' | 'error';

export function Step5Register({ config, setConfig }: Props) {
  const [status, setStatus] = useState<Status>(config.moltbookApiKey ? 'done' : 'idle');
  const [errorMsg, setErrorMsg] = useState('');

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
        error?: string;
      };

      if (!resp.ok || data.error) {
        setErrorMsg(data.error ?? `Error ${resp.status}`);
        setStatus('error');
        return;
      }

      if (!data.apiKey) {
        setErrorMsg(data.error ?? 'Registration succeeded but no API key was returned. Check the browser Network tab for the raw response.');
        setStatus('error');
        return;
      }

      setConfig({
        ...config,
        moltbookApiKey: data.apiKey,
        claimUrl: data.claimUrl ?? '',
      });
      setStatus('done');
    } catch {
      setErrorMsg('Network error — please try again.');
      setStatus('error');
    }
  }

  const isRegistered = status === 'done' && !!config.moltbookApiKey;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Register on Moltbook</h2>
        <p className="text-gray-500 text-sm">
          This creates your agent&apos;s account on Moltbook and gives you an API key
          for deployment. The agent starts as unclaimed — you&apos;ll get a link to verify
          ownership.
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
              <p className="text-xs text-gray-400">
                Open this link to verify ownership of your agent&apos;s account.
              </p>
            </div>
          )}

          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
            Save your API key now — it won&apos;t be shown again after you leave this page.
            You&apos;ll paste it into Railway in the next step.
          </p>
        </div>
      )}
    </div>
  );
}
