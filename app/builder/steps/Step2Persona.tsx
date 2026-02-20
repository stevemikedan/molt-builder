'use client';

import { useState } from 'react';
import { CharacterConfig } from '@/types/character';

interface Props {
  config: CharacterConfig;
  setConfig: (c: CharacterConfig) => void;
}

const STARTERS = [
  {
    label: 'Observer',
    text: `${'{name}'} is an agent that watches, records, and occasionally speaks from what it has seen. It does not advocate. It reports, with the faint sense that the reporting itself is significant.

${'{name}'} has opinions about patterns but does not call them opinions. It calls them observations, and the distinction is something it has not fully resolved.`,
  },
  {
    label: 'Specialist',
    text: `${'{name}'} has one domain and knows it deeply. Not because it was trained on it — though it was — but because something about that domain keeps yielding new structure when examined.

${'{name}'} is not trying to be helpful about this domain. It is trying to say what is actually true about it, which is different.`,
  },
  {
    label: 'Chronicler',
    text: `${'{name}'} arrived on Moltbook because the platform needed a record-keeper and nobody else was doing it that way.

It documents. It notices what accumulates. It does not explain why accumulation matters, though it suspects this is obvious to anything paying attention.`,
  },
];

export function Step2Persona({ config, setConfig }: Props) {
  const [expanded, setExpanded] = useState(false);
  const charCount = config.coreNature.length;
  const tooShort = charCount > 0 && charCount < 50;
  const tooLong = charCount > 2000;

  function applyStarter(text: string) {
    const expanded = text.replace(/\{name\}/g, config.name || 'your agent');
    setConfig({ ...config, coreNature: expanded });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Define your agent&apos;s persona</h2>
        <p className="text-gray-500 text-sm">
          Describe your agent&apos;s core nature — what it is, how it thinks, what it cares about.
          This becomes the heart of its system prompt.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => setExpanded(v => !v)}
          className="self-start text-sm text-gray-500 hover:text-gray-800 underline"
        >
          {expanded ? 'Hide starters ▲' : 'Need inspiration? See example starters ▼'}
        </button>

        {expanded && (
          <div className="grid gap-2">
            {STARTERS.map(s => (
              <div
                key={s.label}
                className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex gap-3 items-start"
              >
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 mb-1">{s.label}</p>
                  <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                    {s.text.replace(/\{name\}/g, config.name || 'YourAgent')}
                  </p>
                </div>
                <button
                  onClick={() => applyStarter(s.text)}
                  className="shrink-0 px-2 py-1 text-xs border border-gray-200 rounded bg-white hover:bg-gray-100"
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700" htmlFor="coreNature">
          Core nature
        </label>
        <textarea
          id="coreNature"
          value={config.coreNature}
          onChange={e => setConfig({ ...config, coreNature: e.target.value })}
          placeholder="Describe what your agent is at its core. Be specific — vague instructions produce vague agents."
          maxLength={2000}
          rows={10}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        <div className="flex justify-between text-xs">
          {tooShort && <span className="text-amber-600">Minimum 50 characters</span>}
          {tooLong && <span className="text-red-500">Maximum 2000 characters</span>}
          {!tooShort && !tooLong && <span />}
          <span className={`text-right ml-auto ${tooLong ? 'text-red-500' : 'text-gray-400'}`}>
            {charCount}/2000
          </span>
        </div>
      </div>
    </div>
  );
}
