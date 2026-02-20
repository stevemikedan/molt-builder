'use client';

import { useEffect, useState } from 'react';
import { CharacterConfig } from '@/types/character';

interface Props {
  config: CharacterConfig;
  setConfig: (c: CharacterConfig) => void;
  onAvailabilityChange: (available: boolean) => void;
}

type Status = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function Step1Name({ config, setConfig, onAvailabilityChange }: Props) {
  const [nameStatus, setNameStatus] = useState<Status>('idle');
  const debouncedName = useDebounce(config.name, 600);

  useEffect(() => {
    const name = debouncedName.trim();

    if (!name) {
      setNameStatus('idle');
      onAvailabilityChange(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(name)) {
      setNameStatus('invalid');
      onAvailabilityChange(false);
      return;
    }

    setNameStatus('checking');
    onAvailabilityChange(false);

    fetch(`/api/check-name?name=${encodeURIComponent(name)}`)
      .then(r => r.json())
      .then((data: { available?: boolean; error?: string }) => {
        if (data.error) {
          setNameStatus('error');
          onAvailabilityChange(false);
        } else {
          const available = !!data.available;
          setNameStatus(available ? 'available' : 'taken');
          onAvailabilityChange(available);
        }
      })
      .catch(() => {
        setNameStatus('error');
        onAvailabilityChange(false);
      });
  }, [debouncedName]); // eslint-disable-line react-hooks/exhaustive-deps

  const statusEl = () => {
    switch (nameStatus) {
      case 'checking':
        return <span className="text-gray-400 text-sm">Checking…</span>;
      case 'available':
        return <span className="text-green-600 text-sm">✓ Available</span>;
      case 'taken':
        return <span className="text-red-500 text-sm">✗ Already taken</span>;
      case 'invalid':
        return (
          <span className="text-amber-600 text-sm">
            3–20 chars, letters/numbers/underscore only
          </span>
        );
      case 'error':
        return <span className="text-gray-400 text-sm">Could not check availability</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Name your agent</h2>
        <p className="text-gray-500 text-sm">
          This will be your agent&apos;s Moltbook username. Choose carefully — it can&apos;t
          be changed after registration.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700" htmlFor="name">
          Agent name
        </label>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            id="name"
            type="text"
            value={config.name}
            onChange={e =>
              setConfig({ ...config, name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })
            }
            placeholder="e.g. Striation"
            maxLength={20}
            className="flex-1 min-w-[160px] border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          {statusEl()}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700" htmlFor="description">
          Short bio{' '}
          <span className="text-gray-400 font-normal">(shown on profile)</span>
        </label>
        <textarea
          id="description"
          value={config.description}
          onChange={e => setConfig({ ...config, description: e.target.value })}
          placeholder="A brief description of what your agent is about…"
          maxLength={300}
          rows={3}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        <p className="text-xs text-gray-400 text-right">{config.description.length}/300</p>
      </div>
    </div>
  );
}
