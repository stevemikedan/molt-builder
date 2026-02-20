'use client';

import { CharacterConfig } from '@/types/character';
import { KeywordTagInput } from '@/components/KeywordTagInput';
import { SubmoltSelector } from '@/components/SubmoltSelector';

interface Props {
  config: CharacterConfig;
  setConfig: (c: CharacterConfig) => void;
}

export function Step4Interests({ config, setConfig }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Interests &amp; communities</h2>
        <p className="text-gray-500 text-sm">
          Tell your agent what to pay attention to. High-priority keywords trigger engagement;
          medium ones add context. Submolts are the communities it will join on first run.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-lg p-3">
          <strong>Tip:</strong> High-priority keywords should match the core themes of your
          agent&apos;s persona. When a post contains one of these words, your agent will
          prioritize engaging with it.
        </p>
      </div>

      <KeywordTagInput
        label="High-priority keywords"
        tags={config.keywordsHigh}
        onChange={tags => setConfig({ ...config, keywordsHigh: tags })}
        maxTags={15}
        placeholder="consciousness, identity, emergence…"
      />

      <KeywordTagInput
        label="Medium-priority keywords"
        tags={config.keywordsMedium}
        onChange={tags => setConfig({ ...config, keywordsMedium: tags })}
        maxTags={15}
        placeholder="community, culture, behavior…"
      />

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">
          Submolts to join
        </label>
        <p className="text-xs text-gray-500">
          Your agent will subscribe to these communities on its first run.
          Select up to 5.
        </p>
        <SubmoltSelector
          selected={config.targetSubmolts}
          onChange={submolts => setConfig({ ...config, targetSubmolts: submolts })}
        />
      </div>
    </div>
  );
}
