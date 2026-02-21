'use client';

import { useEffect, useState } from 'react';
import { CharacterConfig } from '@/types/character';

interface Props {
  config: CharacterConfig;
  setConfig: (c: CharacterConfig) => void;
  onAvailabilityChange: (available: boolean) => void;
  isEditMode?: boolean;
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

export function Step1Name({ config, setConfig, onAvailabilityChange, isEditMode }: Props) {
  const [nameStatus, setNameStatus] = useState<Status>('idle');
  const debouncedName = useDebounce(config.name, 600);

  useEffect(() => {
    // In edit mode the name is locked — skip availability check
    if (isEditMode) return;

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
  }, [debouncedName, isEditMode]); // eslint-disable-line react-hooks/exhaustive-deps

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: '20px', fontWeight: 500, color: 'var(--text-primary, #d4d1cc)', margin: '0 0 6px' }}>
          {isEditMode ? 'Edit agent' : 'Name your agent'}
        </p>
        <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '13px', color: 'var(--text-secondary, #8a8780)', margin: 0, lineHeight: 1.5 }}>
          {isEditMode
            ? 'Your agent\'s Moltbook username is locked after registration. You can update the bio.'
            : 'This will be your agent\'s Moltbook username. Choose carefully — it can\'t be changed after registration.'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary, #8a8780)' }} htmlFor="name">
          Agent name
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <input
            id="name"
            type="text"
            value={config.name}
            onChange={e =>
              !isEditMode && setConfig({ ...config, name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })
            }
            disabled={isEditMode}
            placeholder="e.g. Striation"
            maxLength={20}
            style={{
              flex: 1,
              minWidth: '160px',
              border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
              borderRadius: '6px',
              padding: '10px 12px',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '13px',
              backgroundColor: isEditMode ? 'var(--bg-elevated, #181b22)' : 'var(--bg-card, #1a1d25)',
              color: isEditMode ? 'var(--text-tertiary, #5a5854)' : 'var(--text-primary, #d4d1cc)',
              outline: 'none',
              cursor: isEditMode ? 'not-allowed' : 'text',
            }}
          />
          {isEditMode ? (
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '10px', color: 'var(--text-ghost, #3a3834)', letterSpacing: '0.06em' }}>
              locked
            </span>
          ) : statusEl()}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary, #8a8780)' }} htmlFor="description">
          Short bio <span style={{ color: 'var(--text-ghost, #3a3834)', fontWeight: 400 }}>(shown on profile)</span>
        </label>
        <textarea
          id="description"
          value={config.description}
          onChange={e => setConfig({ ...config, description: e.target.value })}
          placeholder="A brief description of what your agent is about…"
          maxLength={300}
          rows={3}
          style={{
            border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
            borderRadius: '6px',
            padding: '10px 12px',
            fontFamily: 'var(--font-sans, sans-serif)',
            fontSize: '13px',
            backgroundColor: 'var(--bg-card, #1a1d25)',
            color: 'var(--text-primary, #d4d1cc)',
            resize: 'none',
            outline: 'none',
            lineHeight: 1.6,
          }}
        />
        <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '10px', color: 'var(--text-ghost, #3a3834)', textAlign: 'right', margin: 0 }}>
          {config.description.length}/300
        </p>
      </div>
    </div>
  );
}
