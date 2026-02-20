'use client';

import { useState } from 'react';
import { CharacterConfig, DEFAULT_CONFIG } from '@/types/character';
import { Step1Name } from './steps/Step1Name';
import { Step2Persona } from './steps/Step2Persona';
import { Step3Voice } from './steps/Step3Voice';
import { Step4Interests } from './steps/Step4Interests';
import { Step5Register } from './steps/Step5Register';
import { Step6Preview } from './steps/Step6Preview';
import { Step7Deploy } from './steps/Step7Deploy';

const STEPS = [
  'Name',
  'Persona',
  'Voice',
  'Interests',
  'Register',
  'Preview',
  'Deploy',
] as const;

function canAdvance(step: number, config: CharacterConfig, nameAvailable: boolean): boolean {
  switch (step) {
    case 0:
      return (
        /^[a-zA-Z0-9_]{3,20}$/.test(config.name) &&
        nameAvailable &&
        config.description.length > 0 &&
        config.description.length <= 300
      );
    case 1:
      return config.coreNature.length >= 50 && config.coreNature.length <= 2000;
    case 2:
      return (
        config.voiceRules.length >= 1 &&
        config.voiceRules.every(r => r.trim().length > 0)
      );
    case 3:
      return config.targetSubmolts.length >= 1;
    case 4:
      return !!config.moltbookApiKey;
    case 5:
    case 6:
      return true;
    default:
      return true;
  }
}

export default function BuilderPage() {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<CharacterConfig>(DEFAULT_CONFIG);
  const [nameAvailable, setNameAvailable] = useState(false);

  const isLast = step === STEPS.length - 1;
  const canNext = canAdvance(step, config, nameAvailable);

  function handleSetConfig(next: CharacterConfig) {
    if (next.name !== config.name) setNameAvailable(false);
    setConfig(next);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <a href="/" className="text-sm text-gray-400 hover:text-gray-600">
            ← Molt Builder
          </a>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center">
              <button
                onClick={() => { if (i < step) setStep(i); }}
                disabled={i > step}
                title={label}
                className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-colors ${
                  i === step
                    ? 'bg-gray-900 text-white'
                    : i < step
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer'
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-6 mx-0.5 ${i < step ? 'bg-gray-300' : 'bg-gray-100'}`} />
              )}
            </div>
          ))}
          <span className="ml-3 text-sm text-gray-500">{STEPS[step]}</span>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          {step === 0 && (
            <Step1Name
              config={config}
              setConfig={handleSetConfig}
              onAvailabilityChange={setNameAvailable}
            />
          )}
          {step === 1 && <Step2Persona config={config} setConfig={setConfig} />}
          {step === 2 && <Step3Voice config={config} setConfig={setConfig} />}
          {step === 3 && <Step4Interests config={config} setConfig={setConfig} />}
          {step === 4 && <Step5Register config={config} setConfig={setConfig} />}
          {step === 5 && <Step6Preview config={config} />}
          {step === 6 && <Step7Deploy config={config} />}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-0 transition-colors"
          >
            ← Back
          </button>

          {!isLast && (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext}
              className="px-5 py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Continue →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
