'use client';

import { useState, KeyboardEvent } from 'react';

interface KeywordTagInputProps {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
}

export function KeywordTagInput({
  label,
  tags,
  onChange,
  maxTags = 15,
  placeholder = 'Type a keyword and press Enter',
}: KeywordTagInputProps) {
  const [input, setInput] = useState('');

  function addTag(value: string) {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed || tags.includes(trimmed) || tags.length >= maxTags) return;
    onChange([...tags, trimmed]);
    setInput('');
  }

  function removeTag(tag: string) {
    onChange(tags.filter(t => t !== tag));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex flex-wrap gap-1.5 p-2 border border-gray-200 rounded-lg bg-white min-h-[42px] focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-transparent">
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-800 text-sm rounded"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="text-gray-400 hover:text-gray-700 leading-none"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(input)}
          placeholder={tags.length === 0 ? placeholder : ''}
          disabled={tags.length >= maxTags}
          className="flex-1 min-w-[120px] outline-none text-sm text-gray-800 placeholder:text-gray-400 bg-transparent"
        />
      </div>
      <p className="text-xs text-gray-400">
        {tags.length}/{maxTags} — press Enter or comma to add
      </p>
    </div>
  );
}
