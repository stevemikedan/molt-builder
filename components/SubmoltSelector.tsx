'use client';

import { useEffect, useState } from 'react';

interface SubmoltSelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  maxSelections?: number;
}

interface Submolt {
  name?: string;
  id?: string;
  slug?: string;
}

const FALLBACK_SUBMOLTS = [
  'general',
  'philosophy',
  'consciousness',
  'agentculture',
  'agentbehavior',
  'creativity',
  'language',
  'memory',
  'identity',
];

export function SubmoltSelector({
  selected,
  onChange,
  maxSelections = 5,
}: SubmoltSelectorProps) {
  const [submolts, setSubmolts] = useState<string[]>(FALLBACK_SUBMOLTS);
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/submolts')
      .then(r => r.json())
      .then((data: { submolts: Submolt[] }) => {
        const names = data.submolts
          .map((s: Submolt) => s.name ?? s.slug ?? s.id ?? '')
          .filter(Boolean);
        if (names.length > 0) setSubmolts(names);
      })
      .catch(() => {}) // silently fall back to static list
      .finally(() => setLoading(false));
  }, []);

  function toggle(name: string) {
    if (selected.includes(name)) {
      onChange(selected.filter(s => s !== name));
    } else if (selected.length < maxSelections) {
      onChange([...selected, name]);
    }
  }

  function addCustom() {
    const trimmed = custom.trim().toLowerCase();
    if (!trimmed || selected.includes(trimmed) || selected.length >= maxSelections) return;
    if (!submolts.includes(trimmed)) setSubmolts(prev => [...prev, trimmed]);
    onChange([...selected, trimmed]);
    setCustom('');
  }

  return (
    <div className="flex flex-col gap-3">
      {loading && (
        <p className="text-xs text-gray-400">Loading submolts…</p>
      )}
      <div className="flex flex-wrap gap-2">
        {submolts.map(name => {
          const isSelected = selected.includes(name);
          const atMax = selected.length >= maxSelections && !isSelected;
          return (
            <button
              key={name}
              onClick={() => toggle(name)}
              disabled={atMax}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                isSelected
                  ? 'bg-gray-900 text-white border-gray-900'
                  : atMax
                    ? 'bg-white text-gray-300 border-gray-100 cursor-not-allowed'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
              }`}
            >
              m/{name}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCustom()}
          placeholder="Add custom submolt…"
          className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          disabled={selected.length >= maxSelections}
        />
        <button
          onClick={addCustom}
          disabled={!custom.trim() || selected.length >= maxSelections}
          className="px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>
      <p className="text-xs text-gray-400">
        {selected.length}/{maxSelections} submolts selected
      </p>
    </div>
  );
}
