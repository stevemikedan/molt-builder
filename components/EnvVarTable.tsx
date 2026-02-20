'use client';

import { useState } from 'react';
import { EnvVarMap } from '@/lib/buildEnvVars';

interface EnvVarTableProps {
  vars: EnvVarMap;
}

const SENSITIVE_KEYS = new Set(['MOLTBOOK_API_KEY']);
const PLACEHOLDER_KEYS = new Set(['ANTHROPIC_API_KEY']);

export function EnvVarTable({ vars }: EnvVarTableProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [allCopied, setAllCopied] = useState(false);

  async function copyValue(key: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  async function copyAll() {
    const text = Object.entries(vars)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
    await navigator.clipboard.writeText(text);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  }

  const entries = Object.entries(vars) as [keyof EnvVarMap, string][];

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-1/3">
                Variable
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Value
              </th>
              <th className="w-16" />
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, value]) => {
              const isPlaceholder = PLACEHOLDER_KEYS.has(key);
              const isSensitive = SENSITIVE_KEYS.has(key);
              const displayValue = isSensitive && value
                ? '•'.repeat(Math.min(value.length, 20))
                : value;

              return (
                <tr
                  key={key}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 align-top">
                    {key}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs align-top break-all">
                    <span className={isPlaceholder ? 'text-amber-600' : 'text-gray-600'}>
                      {displayValue || <span className="text-gray-300 italic">empty</span>}
                    </span>
                  </td>
                  <td className="px-2 py-2 align-top">
                    <button
                      onClick={() => copyValue(key, value)}
                      disabled={!value || isPlaceholder}
                      className="px-2 py-1 text-xs rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      {copiedKey === key ? '✓' : 'Copy'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        onClick={copyAll}
        className="self-start px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        {allCopied ? '✓ Copied all' : 'Copy all as .env'}
      </button>

      {Object.keys(vars).some(k => PLACEHOLDER_KEYS.has(k)) && (
        <p className="text-xs text-amber-600">
          ⚠ ANTHROPIC_API_KEY shown as placeholder — paste your own key when prompted by Railway.
        </p>
      )}
    </div>
  );
}
