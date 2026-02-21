'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CharacterConfig, DEFAULT_CONFIG } from '@/types/character';
import { Step1Name } from './steps/Step1Name';
import { Step2Persona } from './steps/Step2Persona';
import { Step3Voice } from './steps/Step3Voice';
import { Step4Interests } from './steps/Step4Interests';
import { Step5Capabilities } from './steps/Step5Capabilities';
import { Step5Register } from './steps/Step5Register';
import { Step6Preview } from './steps/Step6Preview';
import { Step7Deploy } from './steps/Step7Deploy';
import { saveAgent, savePendingAgent, getAgents, StoredAgent } from '@/lib/agentStorage';
import { buildEnvVars } from '@/lib/buildEnvVars';

const STEPS = ['Name', 'Persona', 'Voice', 'Interests', 'Capabilities', 'Register', 'Preview', 'Deploy'] as const;

function canAdvance(step: number, config: CharacterConfig, nameAvailable: boolean, isEditMode: boolean): boolean {
  switch (step) {
    case 0:
      // In edit mode the name is locked — just need a valid description
      if (isEditMode) return config.description.length > 0 && config.description.length <= 300;
      return (
        /^[a-zA-Z0-9_]{3,20}$/.test(config.name) &&
        nameAvailable &&
        config.description.length > 0 &&
        config.description.length <= 300
      );
    case 1:
      return config.coreNature.length >= 50 && config.coreNature.length <= 2000;
    case 2:
      return config.voiceRules.length >= 1 && config.voiceRules.every(r => r.trim().length > 0);
    case 3:
      return config.targetSubmolts.length >= 1;
    case 4:
      // Capabilities — always optional, always advance
      return true;
    case 5:
      // Register — In edit mode the agent is already registered
      return isEditMode ? true : !!config.moltbookApiKey;
    case 6:
    case 7:
      return true;
    default:
      return true;
  }
}

export default function BuilderPage() {
  return (
    <Suspense>
      <BuilderInner />
    </Suspense>
  );
}

function BuilderInner() {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<CharacterConfig>(DEFAULT_CONFIG);
  const [nameAvailable, setNameAvailable] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editAgentId, setEditAgentId] = useState<string | undefined>(undefined);
  const [editRailwayConfig, setEditRailwayConfig] = useState<StoredAgent['railwayConfig']>(undefined);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load existing agent if ?edit=<id>
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId) return;
    const agents = getAgents();
    const agent = agents.find(a => a.id === editId);
    if (!agent) return;
    setIsEditMode(true);
    setEditAgentId(agent.id);
    setEditRailwayConfig(agent.railwayConfig);
    setConfig(agent.config);
    setNameAvailable(true); // name is locked, treat as valid
  }, [searchParams]);

  function handleRegistered(data: { apiKey: string; claimUrl: string; tweetTemplate: string }) {
    const updatedConfig = { ...config, moltbookApiKey: data.apiKey, claimUrl: data.claimUrl };
    const envVars = buildEnvVars(updatedConfig);
    savePendingAgent(updatedConfig, envVars, data.claimUrl, data.tweetTemplate);
  }

  function handleSave() {
    const envVars = buildEnvVars(config, userApiKey);
    saveAgent(config, envVars);
    router.push('/');
  }

  const isLast = step === STEPS.length - 1;
  const canNext = canAdvance(step, config, nameAvailable, isEditMode);

  function handleSetConfig(next: CharacterConfig) {
    if (!isEditMode && next.name !== config.name) setNameAvailable(false);
    setConfig(next);
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base, #0a0b0d)' }}>
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <a href="/" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '12px', color: 'var(--text-tertiary, #5a5854)', textDecoration: 'none' }}>
            ← Dashboard
          </a>
          {isEditMode && (
            <span style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '9px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '3px 10px',
              borderRadius: '20px',
              backgroundColor: 'rgba(196,149,106,0.1)',
              border: '1px solid rgba(196,149,106,0.25)',
              color: 'var(--accent-amber, #c4956a)',
            }}>
              Editing {config.name}
            </span>
          )}
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '32px' }}>
          {STEPS.map((label, i) => {
            const isActive = i === step;
            const isDone = i < step;
            const isLocked = i > step;
            // In edit mode step 5 (Register) is auto-complete
            const isAutoComplete = isEditMode && i === 5;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <button
                  onClick={() => { if (isDone || isAutoComplete) setStep(i); }}
                  disabled={isLocked && !isAutoComplete}
                  title={label}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    border: isActive
                      ? '1px solid var(--accent-amber, #c4956a)'
                      : isDone || isAutoComplete
                        ? '1px solid var(--border-dim, rgba(255,255,255,0.08))'
                        : '1px solid var(--border-subtle, rgba(255,255,255,0.04))',
                    backgroundColor: isActive
                      ? 'rgba(196,149,106,0.15)'
                      : 'transparent',
                    color: isActive
                      ? 'var(--accent-amber, #c4956a)'
                      : isDone || isAutoComplete
                        ? 'var(--text-tertiary, #5a5854)'
                        : 'var(--text-ghost, #3a3834)',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: (isDone || isAutoComplete) ? 'pointer' : 'default',
                    transition: 'all 120ms ease',
                  }}
                >
                  {(isDone || isAutoComplete) ? '✓' : i + 1}
                </button>
                {i < STEPS.length - 1 && (
                  <div style={{
                    height: '1px',
                    width: '20px',
                    margin: '0 2px',
                    backgroundColor: isDone || isAutoComplete
                      ? 'var(--border-dim, rgba(255,255,255,0.08))'
                      : 'var(--border-subtle, rgba(255,255,255,0.04))',
                  }} />
                )}
              </div>
            );
          })}
          <span style={{ marginLeft: '12px', fontFamily: 'var(--font-sans, sans-serif)', fontSize: '13px', color: 'var(--text-tertiary, #5a5854)' }}>
            {STEPS[step]}
          </span>
        </div>

        {/* Step content */}
        <div style={{
          backgroundColor: 'var(--bg-surface, #111318)',
          border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
          borderRadius: '16px',
          padding: '28px',
          marginBottom: '24px',
        }}>
          {step === 0 && (
            <Step1Name
              config={config}
              setConfig={handleSetConfig}
              onAvailabilityChange={setNameAvailable}
              isEditMode={isEditMode}
            />
          )}
          {step === 1 && <Step2Persona config={config} setConfig={setConfig} />}
          {step === 2 && <Step3Voice config={config} setConfig={setConfig} />}
          {step === 3 && <Step4Interests config={config} setConfig={setConfig} />}
          {step === 4 && <Step5Capabilities config={config} setConfig={setConfig} />}
          {step === 5 && (
            <Step5Register
              config={config}
              setConfig={setConfig}
              onRegistered={handleRegistered}
              isEditMode={isEditMode}
            />
          )}
          {step === 6 && (
            <Step6Preview
              config={config}
              userApiKey={userApiKey}
              setUserApiKey={setUserApiKey}
            />
          )}
          {step === 7 && (
            <Step7Deploy
              config={config}
              userApiKey={userApiKey}
              onSave={handleSave}
              isEditMode={isEditMode}
              agentId={editAgentId}
              railwayConfig={editRailwayConfig}
            />
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              color: step === 0 ? 'transparent' : 'var(--text-tertiary, #5a5854)',
              fontFamily: 'var(--font-sans, sans-serif)',
              fontSize: '13px',
              cursor: step === 0 ? 'default' : 'pointer',
            }}
          >
            ← Back
          </button>

          {!isLast && (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: '1px solid var(--accent-amber, #c4956a)',
                backgroundColor: canNext ? 'transparent' : 'transparent',
                color: canNext ? 'var(--accent-amber, #c4956a)' : 'var(--text-ghost, #3a3834)',
                borderColor: canNext ? 'var(--accent-amber, #c4956a)' : 'var(--border-subtle, rgba(255,255,255,0.04))',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: canNext ? 'pointer' : 'not-allowed',
                transition: 'all 120ms ease',
              }}
              onMouseEnter={(e) => {
                if (canNext) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(196,149,106,0.12)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              }}
            >
              Continue →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
