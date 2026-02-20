'use client';

import { useState } from 'react';

interface CopyFieldProps {
  label: string;
  value: string;
  masked?: boolean;
}

export function CopyField({ label, value, masked = false }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const displayValue = masked && value ? '•'.repeat(Math.min(value.length, 24)) : value;

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={displayValue}
          className="flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm font-mono text-gray-800 select-all"
        />
        <button
          onClick={handleCopy}
          disabled={!value}
          className="shrink-0 px-3 py-2 text-sm rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
