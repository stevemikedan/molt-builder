'use client';

import { useState } from 'react';
import { CharacterConfig } from '@/types/character';
import { VoiceRulesList } from '@/components/VoiceRulesList';

interface Props {
  config: CharacterConfig;
  setConfig: (c: CharacterConfig) => void;
}

export function Step3Voice({ config, setConfig }: Props) {
  const [newExample, setNewExample] = useState('');

  function addExample() {
    const trimmed = newExample.trim();
    if (!trimmed || trimmed.length > 200 || config.examplePosts.length >= 5) return;
    setConfig({ ...config, examplePosts: [...config.examplePosts, trimmed] });
    setNewExample('');
  }

  function removeExample(i: number) {
    setConfig({
      ...config,
      examplePosts: config.examplePosts.filter((_, idx) => idx !== i),
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Voice &amp; style</h2>
        <p className="text-gray-500 text-sm">
          Define how your agent writes. Voice rules are enforced absolutely — they shape
          every post and comment. Example posts show the style you&apos;re aiming for.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-700">Voice rules</h3>
        <p className="text-xs text-gray-500">
          Write rules that govern how your agent speaks. Drag to reorder by priority.
        </p>
        <VoiceRulesList
          rules={config.voiceRules}
          onChange={rules => setConfig({ ...config, voiceRules: rules })}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Example posts{' '}
          <span className="text-gray-400 font-normal">(optional)</span>
        </h3>
        <p className="text-xs text-gray-500">
          Write 1–5 example posts that capture the style you want. The model uses these as
          reference — not to repeat, but to understand the register.
        </p>

        {config.examplePosts.map((post, i) => (
          <div key={i} className="flex gap-2">
            <textarea
              value={post}
              onChange={e => {
                const next = [...config.examplePosts];
                next[i] = e.target.value;
                setConfig({ ...config, examplePosts: next });
              }}
              maxLength={200}
              rows={2}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button
              onClick={() => removeExample(i)}
              className="text-gray-300 hover:text-red-400 transition-colors mt-1"
              aria-label="Remove example"
            >
              ✕
            </button>
          </div>
        ))}

        {config.examplePosts.length < 5 && (
          <div className="flex gap-2">
            <textarea
              value={newExample}
              onChange={e => setNewExample(e.target.value)}
              placeholder="Write an example post in your agent's voice…"
              maxLength={200}
              rows={2}
              className="flex-1 border border-dashed border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button
              onClick={addExample}
              disabled={!newExample.trim()}
              className="self-start px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        )}
        <p className="text-xs text-gray-400">
          {config.examplePosts.length}/5 examples · max 200 chars each
        </p>
      </div>
    </div>
  );
}
