'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StoredAgent, deleteAgent, updateRailwayConfig, updateDirection, updateEnvVars, addLogEntry } from '@/lib/agentStorage';
import { getRailwayToken } from '@/lib/railwayStorage';
import { EnvVarMap, mergeDirectionIntoEnvVars } from '@/lib/buildEnvVars';

const ACCENT_MAP: Record<string, string> = {
  amber:  'var(--accent-amber)',
  teal:   'var(--accent-teal)',
  violet: 'var(--accent-violet)',
  rust:   'var(--accent-rust)',
  slate:  'var(--accent-slate)',
  bone:   'var(--accent-bone)',
};

const ACCENT_DIM_MAP: Record<string, string> = {
  amber:  'var(--accent-amber-dim)',
  teal:   'var(--accent-teal-dim)',
  violet: 'var(--accent-violet-dim)',
  rust:   'var(--accent-rust-dim)',
  slate:  'var(--accent-slate-dim)',
  bone:   'var(--accent-bone-dim)',
};

interface AgentDetailPanelProps {
  agent: StoredAgent | null;
  onClose: () => void;
  onDeleted?: () => void;
}

interface LiveActivity {
  status: Record<string, unknown> | null;
  profile: Record<string, unknown> | null;
  publicProfile: Record<string, unknown> | null;
  recentContent: Record<string, unknown>[] | null;
  recentPosts: Record<string, unknown>[] | null;
}

type PushState = 'idle' | 'pushing' | 'success' | 'error';

export default function AgentDetailPanel({ agent, onClose, onDeleted }: AgentDetailPanelProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [activity, setActivity] = useState<LiveActivity | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);

  // Railway connect form
  const [rwProjectId, setRwProjectId] = useState('');
  const [rwServiceId, setRwServiceId] = useState('');
  const [rwEnvironmentId, setRwEnvironmentId] = useState('production');

  // Railway push state
  const [pushState, setPushState] = useState<PushState>('idle');
  const [pushError, setPushError] = useState('');

  // Direction state
  const [dirContextNotes, setDirContextNotes] = useState(agent?.direction?.contextNotes ?? '');
  const [dirFocusTopics, setDirFocusTopics] = useState<string[]>(agent?.direction?.focusTopics ?? []);
  const [dirPriorityPosts, setDirPriorityPosts] = useState<string[]>(agent?.direction?.priorityPosts ?? []);
  const [dirSubmoltFocus, setDirSubmoltFocus] = useState(agent?.direction?.submoltFocus ?? '');
  const [dirExtraHigh, setDirExtraHigh] = useState<string[]>(agent?.direction?.extraKeywordsHigh ?? []);
  const [dirExtraMedium, setDirExtraMedium] = useState<string[]>(agent?.direction?.extraKeywordsMedium ?? []);
  const [dirPushState, setDirPushState] = useState<PushState>('idle');
  const [dirPushError, setDirPushError] = useState('');
  const [dirPostInput, setDirPostInput] = useState('');

  // Env var editing state
  const [editingEnvKey, setEditingEnvKey] = useState<string | null>(null);
  const [editingEnvValue, setEditingEnvValue] = useState('');
  const [localEnvVars, setLocalEnvVars] = useState<EnvVarMap>(agent?.envVars ? { ...agent.envVars } : {} as EnvVarMap);
  const [envDirty, setEnvDirty] = useState(false);
  const [envPushState, setEnvPushState] = useState<PushState>('idle');
  const [envPushError, setEnvPushError] = useState('');

  useEffect(() => {
    if (!agent) return;
    const apiKey = agent.envVars?.MOLTBOOK_API_KEY;
    if (!apiKey || apiKey.startsWith('<')) return;

    setActivityLoading(true);
    fetch(`/api/agent-activity?name=${encodeURIComponent(agent.name)}`, {
      headers: { 'x-moltbook-key': apiKey },
    })
      .then(r => r.json() as Promise<LiveActivity>)
      .then(data => setActivity(data))
      .catch(() => { /* silent — live data is best-effort */ })
      .finally(() => setActivityLoading(false));
  }, [agent?.id]);

  if (!agent) return null;

  const accentColor = ACCENT_MAP[agent.accentColor] ?? ACCENT_MAP.amber;
  const accentDim   = ACCENT_DIM_MAP[agent.accentColor] ?? ACCENT_DIM_MAP.amber;
  const envVars     = agent.envVars as EnvVarMap;

  const highKwDisplay = (agent.config.keywordsHigh ?? []).slice(0, 5).join(', ');
  const submoltsDisplay = (agent.config.targetSubmolts ?? []).join(', ');
  const voiceRulesCount = (agent.config.voiceRules ?? []).length;
  const claimUrl = agent.config.claimUrl;

  function maskValue(key: string, value: string): string {
    if ((key === 'MOLTBOOK_API_KEY' || key === 'ANTHROPIC_API_KEY') && value && !value.startsWith('<')) {
      const visible = value.slice(-4);
      return `••••••••${visible}`;
    }
    return value;
  }

  function envToEnvFile(vars: EnvVarMap): string {
    return Object.entries(vars)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
  }

  function handleCopyEnv() {
    const text = envToEnvFile(envVars);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.55)',
          zIndex: 100,
        }}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${agent.name} details`}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '560px',
          maxWidth: '100vw',
          backgroundColor: 'var(--bg-surface, #111318)',
          borderLeft: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          animation: 'panel-slide-in 220ms cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        <style>{`
          @keyframes panel-slide-in {
            from { transform: translateX(40px); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>

        {/* Colored top accent bar */}
        <div
          style={{
            height: '4px',
            backgroundColor: accentColor,
            flexShrink: 0,
          }}
        />

        {/* Header */}
        <div
          style={{
            padding: '24px 28px 20px',
            borderBottom: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
            flexShrink: 0,
            display: 'flex',
            gap: '16px',
            alignItems: 'flex-start',
          }}
        >
          {/* Sigil */}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              backgroundColor: accentDim,
              border: `1px solid ${accentColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontFamily: 'var(--font-serif, serif)',
              fontSize: '22px',
              fontWeight: 600,
              color: accentColor,
            }}
          >
            {agent.sigil}
          </div>

          {/* Name + description */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                fontFamily: 'var(--font-serif, serif)',
                fontSize: '20px',
                fontWeight: 500,
                color: 'var(--text-primary, #d4d1cc)',
                margin: '0 0 6px 0',
                lineHeight: 1.2,
              }}
            >
              {agent.name}
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-sans, sans-serif)',
                fontSize: '13px',
                lineHeight: 1.5,
                color: 'var(--text-secondary, #8a8780)',
                margin: 0,
              }}
            >
              {agent.description}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close panel"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-tertiary, #5a5854)',
              fontSize: '16px',
              lineHeight: 1,
              flexShrink: 0,
              transition: 'background-color 120ms ease, color 120ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-elevated, #181b22)';
              e.currentTarget.style.color = 'var(--text-primary, #d4d1cc)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-tertiary, #5a5854)';
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

          {/* ── Section: CONFIGURATION ─────────────────────────── */}
          <SectionHeading>Configuration</SectionHeading>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              marginBottom: '28px',
            }}
          >
            <ConfigTile label="Name" value={agent.name} />
            <ConfigTile label="Post Schedule" value="Every 2h ±10min" />
            <ConfigTile
              label="Description"
              value={agent.description}
              fullWidth
            />
            <ConfigTile
              label="Target Submolts"
              value={submoltsDisplay || '—'}
              fullWidth
            />
            <ConfigTile
              label="Voice Rules"
              value={`${voiceRulesCount} rule${voiceRulesCount !== 1 ? 's' : ''}`}
            />
            <ConfigTile
              label="High Keywords"
              value={highKwDisplay || '—'}
            />
          </div>

          {/* ── Section: ENVIRONMENT VARIABLES ─────────────────── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            <SectionHeading noMargin>Environment Variables</SectionHeading>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {envDirty && (
                <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '9px', color: 'var(--accent-amber, #c4956a)', letterSpacing: '0.05em' }}>
                  {agent.railwayConfig ? 'saved locally — not yet deployed' : 'saved'}
                </span>
              )}
              {envDirty && agent.railwayConfig && (
                <button
                  disabled={envPushState === 'pushing'}
                  onClick={async () => {
                    const token = getRailwayToken();
                    if (!token) {
                      setEnvPushError('No Railway token set.');
                      setEnvPushState('error');
                      return;
                    }
                    setEnvPushState('pushing');
                    setEnvPushError('');
                    try {
                      const resp = await fetch('/api/railway-push', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          envVars: localEnvVars,
                          railwayToken: token,
                          projectId: agent.railwayConfig!.projectId,
                          serviceId: agent.railwayConfig!.serviceId,
                          environmentId: agent.railwayConfig!.environmentId,
                        }),
                      });
                      const data = await resp.json();
                      if (data.ok) {
                        addLogEntry(agent.id, 'Environment variables pushed to Railway');
                        setEnvPushState('success');
                        setEnvDirty(false);
                        setTimeout(() => setEnvPushState('idle'), 4000);
                      } else {
                        setEnvPushError(data.error ?? 'Push failed');
                        setEnvPushState('error');
                      }
                    } catch (e) {
                      setEnvPushError(e instanceof Error ? e.message : 'Network error');
                      setEnvPushState('error');
                    }
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '5px',
                    border: `1px solid ${envPushState === 'success' ? 'var(--accent-teal, #5a9e8f)' : 'var(--accent-amber, #c4956a)'}`,
                    backgroundColor: 'transparent',
                    color: envPushState === 'success' ? 'var(--accent-teal, #5a9e8f)' : 'var(--accent-amber, #c4956a)',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '10px',
                    letterSpacing: '0.05em',
                    cursor: envPushState === 'pushing' ? 'wait' : 'pointer',
                  }}
                >
                  {envPushState === 'pushing' ? 'Deploying...' : envPushState === 'success' ? 'Deployed' : 'Deploy to Railway'}
                </button>
              )}
              <button
                onClick={handleCopyEnv}
                style={{
                  padding: '5px 12px',
                  borderRadius: '5px',
                  border: '1px solid var(--border-active, rgba(255,255,255,0.15))',
                  backgroundColor: 'transparent',
                  color: copied
                    ? 'var(--accent-teal, #5a9e8f)'
                    : 'var(--text-secondary, #8a8780)',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '10px',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  transition: 'color 120ms ease, border-color 120ms ease',
                }}
              >
                {copied ? 'Copied!' : 'Copy .env'}
              </button>
            </div>
          </div>

          {envPushState === 'error' && envPushError && (
            <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '11px', color: 'var(--accent-rust, #a06b5a)', margin: '0 0 8px', lineHeight: 1.4 }}>
              {envPushError}
            </p>
          )}

          <div
            style={{
              borderRadius: '8px',
              border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
              overflow: 'hidden',
              marginBottom: '28px',
            }}
          >
            {Object.entries(localEnvVars).map(([key, value], i) => {
              const isApiKey = key === 'MOLTBOOK_API_KEY';
              const isAnthropicKey = key === 'ANTHROPIC_API_KEY';
              const isRedacted = isApiKey || (isAnthropicKey && value === '<your-anthropic-api-key>');
              const isEditing = editingEnvKey === key;
              const displayValue = isApiKey && value && !value.startsWith('<')
                ? maskValue(key, value)
                : value;

              return (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '9px 14px',
                    borderBottom:
                      i < Object.keys(localEnvVars).length - 1
                        ? '1px solid var(--border-subtle, rgba(255,255,255,0.04))'
                        : 'none',
                    backgroundColor:
                      i % 2 === 0
                        ? 'var(--bg-card, #1a1d25)'
                        : 'var(--bg-elevated, #181b22)',
                    alignItems: 'flex-start',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '10px',
                      color: 'var(--accent-amber, #c4956a)',
                      letterSpacing: '0.03em',
                      flexShrink: 0,
                      width: '220px',
                      paddingTop: '1px',
                    }}
                  >
                    {key}
                  </span>
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editingEnvValue}
                      onChange={e => setEditingEnvValue(e.target.value)}
                      onBlur={() => {
                        const updated = { ...localEnvVars, [key]: editingEnvValue };
                        setLocalEnvVars(updated as EnvVarMap);
                        updateEnvVars(agent.id, updated as EnvVarMap);
                        setEnvDirty(true);
                        setEditingEnvKey(null);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const updated = { ...localEnvVars, [key]: editingEnvValue };
                          setLocalEnvVars(updated as EnvVarMap);
                          updateEnvVars(agent.id, updated as EnvVarMap);
                          setEnvDirty(true);
                          setEditingEnvKey(null);
                        } else if (e.key === 'Escape') {
                          setEditingEnvKey(null);
                        }
                      }}
                      style={{
                        flex: 1,
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '10px',
                        color: 'var(--text-primary, #c8c3b8)',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--accent-amber, #c4956a)',
                        borderRadius: '3px',
                        padding: '2px 6px',
                        outline: 'none',
                      }}
                    />
                  ) : (
                    <span
                      onClick={() => {
                        setEditingEnvKey(key);
                        setEditingEnvValue(isRedacted && !isAnthropicKey ? '' : value);
                      }}
                      title="Click to edit"
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '10px',
                        color: isAnthropicKey && value === '<your-anthropic-api-key>'
                          ? 'var(--text-tertiary, #5a5854)'
                          : 'var(--text-secondary, #8a8780)',
                        fontStyle: isAnthropicKey && value === '<your-anthropic-api-key>' ? 'italic' : 'normal',
                        wordBreak: 'break-all',
                        flex: 1,
                        cursor: 'pointer',
                        borderRadius: '3px',
                        padding: '0 2px',
                        transition: 'background-color 120ms ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {isAnthropicKey && value === '<your-anthropic-api-key>' ? '(click to set Anthropic API key)' : displayValue || '(empty — click to set)'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Section: CLAIM (pending agents only) ───────────── */}
          {agent.status === 'pending' && (
            <div style={{ marginBottom: '28px' }}>
              <SectionHeading>Claim your agent</SectionHeading>
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(196,149,106,0.06)',
                  border: '1px solid rgba(196,149,106,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '13px', color: 'var(--text-secondary, #8a8780)', margin: 0, lineHeight: 1.5 }}>
                  Your agent is registered but not yet active. Complete both steps below to activate it.
                </p>

                <div>
                  <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-ghost, #3a3834)', margin: '0 0 6px' }}>Step 1 — Visit claim URL</p>
                  {agent.pendingInfo?.claimUrl && (
                    <a href={agent.pendingInfo.claimUrl} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', color: 'var(--accent-teal, #5a9e8f)', wordBreak: 'break-all', textDecoration: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      {agent.pendingInfo.claimUrl}
                    </a>
                  )}
                </div>

                {agent.pendingInfo?.tweetTemplate && (
                  <TweetBlock tweet={agent.pendingInfo.tweetTemplate} />
                )}
              </div>
            </div>
          )}

          {/* ── Section: DEPLOYMENT ────────────────────────────── */}
          <SectionHeading>Deployment</SectionHeading>

          {claimUrl && agent.status !== 'pending' && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-card, #1a1d25)',
                border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
                marginBottom: '12px',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '9px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--text-ghost, #3a3834)',
                  margin: '0 0 6px 0',
                }}
              >
                Claim URL
              </p>
              <a
                href={claimUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '12px',
                  color: 'var(--accent-teal, #5a9e8f)',
                  wordBreak: 'break-all',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.textDecoration = 'underline')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.textDecoration = 'none')
                }
              >
                {claimUrl}
              </a>
            </div>
          )}

          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-card, #1a1d25)',
              border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
              marginBottom: '28px',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-sans, sans-serif)',
                fontSize: '13px',
                color: 'var(--text-secondary, #8a8780)',
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              Deploy via Railway using the env vars above. Click &ldquo;Deploy on Railway&rdquo; from the builder (Step 7) or create a new project from the{' '}
              <a
                href="https://railway.app"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent-teal, #5a9e8f)', textDecoration: 'none' }}
              >
                Railway dashboard
              </a>
              , connect the{' '}
              <code
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '11px',
                  backgroundColor: 'var(--bg-elevated, #181b22)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                }}
              >molt-agent-template</code>{' '}
              repo, and paste in the env vars. For web-enriched synthesis posts, add a{' '}
              <a
                href="https://app.tavily.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent-teal, #5a9e8f)', textDecoration: 'none' }}
              >
                Tavily API key
              </a>{' '}
              and set <code
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '11px',
                  backgroundColor: 'var(--bg-elevated, #181b22)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                }}
              >SYNTHESIS_CYCLE_EVERY</code> to a number &gt; 0.
            </p>
          </div>

          {/* ── Section: RAILWAY ──────────────────────────────── */}
          <SectionHeading>Railway</SectionHeading>
          {!agent.railwayConfig ? (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-card, #1a1d25)',
                border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
                marginBottom: '28px',
              }}
            >
              {/* One-click deploy */}
              <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '12px', color: 'var(--text-secondary, #8a8780)', margin: '0 0 10px', lineHeight: 1.5 }}>
                Deploy your agent to Railway with one click. Your env vars will be pre-filled.
              </p>
              <a
                href={(() => {
                  const repo = 'https://github.com/stevemikedan/molt-agent-template';
                  const envKeys = Object.keys(localEnvVars).filter(k => {
                    const v = localEnvVars[k as keyof EnvVarMap];
                    return v && !v.startsWith('<');
                  });
                  const envDefaults = envKeys.map(k => {
                    const v = localEnvVars[k as keyof EnvVarMap];
                    return `${k}=${encodeURIComponent(v)}`;
                  }).join(',');
                  return `https://railway.app/new/template?template=${encodeURIComponent(repo)}&envs=${envKeys.join(',')}&${envKeys.map(k => `${k}=${encodeURIComponent(localEnvVars[k as keyof EnvVarMap])}`).join('&')}`;
                })()}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '9px 20px',
                  borderRadius: '5px',
                  border: '1px solid var(--accent-teal, #5a9e8f)',
                  backgroundColor: 'rgba(90,158,143,0.08)',
                  color: 'var(--accent-teal, #5a9e8f)',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '11px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  marginBottom: '16px',
                }}
              >
                Deploy on Railway
              </a>
              <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '11px', color: 'var(--text-ghost, #3a3834)', margin: '0 0 16px', lineHeight: 1.5 }}>
                After deploying, come back here and connect the service below to enable push-to-deploy from the builder.
              </p>

              {/* Manual connection */}
              <div style={{ borderTop: '1px solid var(--border-dim, rgba(255,255,255,0.08))', paddingTop: '14px' }}>
                <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '9px', color: 'var(--text-ghost, #3a3834)', margin: '0 0 8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Connect existing service
                </p>
                <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '11px', color: 'var(--text-ghost, #3a3834)', margin: '0 0 12px', lineHeight: 1.5 }}>
                  Save a{' '}
                  <a href="https://railway.app/account/tokens" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-teal, #5a9e8f)', textDecoration: 'none' }}>Railway API token</a>
                  {' '}in Settings on the main dashboard, then enter your service details.
                </p>
              </div>
              <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '9px', color: 'var(--text-ghost, #3a3834)', margin: '0 0 4px', letterSpacing: '0.08em' }}>
                Project ID
              </p>
              <input
                value={rwProjectId}
                onChange={e => setRwProjectId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                style={{ width: '100%', marginBottom: '4px', padding: '7px 10px', borderRadius: '5px', border: '1px solid var(--border-dim, rgba(255,255,255,0.08))', backgroundColor: 'var(--bg-elevated, #181b22)', color: 'var(--text-primary, #d4d1cc)', fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', boxSizing: 'border-box' }}
              />
              <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '10px', color: 'var(--text-ghost, #3a3834)', margin: '0 0 10px', lineHeight: 1.4 }}>
                From your Railway dashboard URL: railway.app/project/<strong>[this-id]</strong>/...
              </p>
              <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '9px', color: 'var(--text-ghost, #3a3834)', margin: '0 0 4px', letterSpacing: '0.08em' }}>
                Service ID
              </p>
              <input
                value={rwServiceId}
                onChange={e => setRwServiceId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                style={{ width: '100%', marginBottom: '4px', padding: '7px 10px', borderRadius: '5px', border: '1px solid var(--border-dim, rgba(255,255,255,0.08))', backgroundColor: 'var(--bg-elevated, #181b22)', color: 'var(--text-primary, #d4d1cc)', fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', boxSizing: 'border-box' }}
              />
              <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '10px', color: 'var(--text-ghost, #3a3834)', margin: '0 0 10px', lineHeight: 1.4 }}>
                Click your service in Railway, then find the ID in the URL: .../service/<strong>[this-id]</strong>
              </p>
              <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '9px', color: 'var(--text-ghost, #3a3834)', margin: '0 0 4px', letterSpacing: '0.08em' }}>
                Environment ID
              </p>
              <input
                value={rwEnvironmentId}
                onChange={e => setRwEnvironmentId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                style={{ width: '100%', marginBottom: '4px', padding: '7px 10px', borderRadius: '5px', border: '1px solid var(--border-dim, rgba(255,255,255,0.08))', backgroundColor: 'var(--bg-elevated, #181b22)', color: 'var(--text-primary, #d4d1cc)', fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', boxSizing: 'border-box' }}
              />
              <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '10px', color: 'var(--text-ghost, #3a3834)', margin: '0 0 12px', lineHeight: 1.4 }}>
                Settings → Environments in your Railway project. Click the environment, find the UUID in the URL.
              </p>
              <button
                disabled={!rwProjectId.trim() || !rwServiceId.trim() || !rwEnvironmentId.trim()}
                onClick={() => {
                  updateRailwayConfig(agent.id, {
                    projectId: rwProjectId.trim(),
                    serviceId: rwServiceId.trim(),
                    environmentId: rwEnvironmentId.trim(),
                  });
                  // Reload page to reflect changes
                  window.location.reload();
                }}
                style={{
                  padding: '7px 16px',
                  borderRadius: '5px',
                  border: '1px solid var(--accent-teal, #5a9e8f)',
                  backgroundColor: 'transparent',
                  color: 'var(--accent-teal, #5a9e8f)',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '10px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  opacity: (!rwProjectId.trim() || !rwServiceId.trim() || !rwEnvironmentId.trim()) ? 0.4 : 1,
                }}
              >
                Connect
              </button>
            </div>
          ) : (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-card, #1a1d25)',
                border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
                marginBottom: '28px',
              }}
            >
              <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '9px', color: 'var(--text-ghost, #3a3834)', margin: '0 0 4px', letterSpacing: '0.08em' }}>
                Connected service
              </p>
              <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '10px', color: 'var(--text-secondary, #8a8780)', margin: '0 0 12px', wordBreak: 'break-all' }}>
                {agent.railwayConfig.projectId} / {agent.railwayConfig.serviceId}
              </p>
              <button
                disabled={pushState === 'pushing'}
                onClick={async () => {
                  const token = getRailwayToken();
                  if (!token) {
                    setPushError('No Railway token set. Add it in Settings below.');
                    setPushState('error');
                    return;
                  }
                  setPushState('pushing');
                  setPushError('');
                  try {
                    const resp = await fetch('/api/railway-push', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        envVars: envVars,
                        railwayToken: token,
                        projectId: agent.railwayConfig!.projectId,
                        serviceId: agent.railwayConfig!.serviceId,
                        environmentId: agent.railwayConfig!.environmentId,
                      }),
                    });
                    const data = await resp.json();
                    if (data.ok) {
                      addLogEntry(agent.id, 'Pushed to Railway — redeploy triggered');
                      setPushState('success');
                      setTimeout(() => setPushState('idle'), 4000);
                    } else {
                      setPushError(data.error ?? 'Push failed');
                      setPushState('error');
                    }
                  } catch (e) {
                    setPushError(e instanceof Error ? e.message : 'Network error');
                    setPushState('error');
                  }
                }}
                style={{
                  padding: '7px 16px',
                  borderRadius: '5px',
                  border: `1px solid ${pushState === 'success' ? 'var(--accent-teal, #5a9e8f)' : pushState === 'error' ? 'var(--accent-rust, #a06b5a)' : 'var(--accent-amber, #c4956a)'}`,
                  backgroundColor: 'transparent',
                  color: pushState === 'success' ? 'var(--accent-teal, #5a9e8f)' : pushState === 'error' ? 'var(--accent-rust, #a06b5a)' : 'var(--accent-amber, #c4956a)',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '10px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: pushState === 'pushing' ? 'wait' : 'pointer',
                  marginBottom: '8px',
                }}
              >
                {pushState === 'pushing' ? 'Pushing…' : pushState === 'success' ? '✓ Deployed' : 'Push to Railway'}
              </button>
              {pushState === 'error' && pushError && (
                <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '11px', color: 'var(--accent-rust, #a06b5a)', margin: '4px 0 8px', lineHeight: 1.4 }}>
                  {pushError}
                </p>
              )}
              <br />
              <button
                onClick={() => {
                  updateRailwayConfig(agent.id, undefined);
                  window.location.reload();
                }}
                style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'var(--font-mono, monospace)', fontSize: '9px', color: 'var(--text-ghost, #3a3834)', cursor: 'pointer', letterSpacing: '0.06em', textDecoration: 'underline' }}
              >
                Disconnect
              </button>
            </div>
          )}

          {/* ── Section: DIRECTION ─────────────────────────────── */}
          {agent.railwayConfig && (
            <div style={{ marginBottom: '28px' }}>
              <SectionHeading>Direction</SectionHeading>
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-card, #1a1d25)',
                  border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '11px', color: 'var(--text-ghost, #3a3834)', margin: 0, lineHeight: 1.5 }}>
                  Guide your agent&apos;s behavior. Changes take effect after Railway redeploy (~1 minute).
                </p>

                {/* Context Notes */}
                <DirectionField label="Context Notes">
                  <textarea
                    value={dirContextNotes}
                    onChange={e => setDirContextNotes(e.target.value)}
                    placeholder="Development updates, talking points, project context..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '5px',
                      border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
                      backgroundColor: 'transparent',
                      color: 'var(--text-primary, #c8c3b8)',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '11px',
                      lineHeight: 1.5,
                      resize: 'vertical',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </DirectionField>

                {/* Focus Topics */}
                <DirectionField label="Focus Topics">
                  <DirectionTagInput
                    tags={dirFocusTopics}
                    onChange={setDirFocusTopics}
                    placeholder="e.g. consciousness, memory"
                  />
                </DirectionField>

                {/* Priority Posts */}
                <DirectionField label="Priority Posts">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {dirPriorityPosts.map(pid => (
                      <div key={pid} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '10px', color: 'var(--text-secondary, #8a8780)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pid}</span>
                        <button
                          onClick={() => setDirPriorityPosts(prev => prev.filter(p => p !== pid))}
                          style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'var(--font-mono, monospace)', fontSize: '12px', color: 'var(--text-ghost, #3a3834)', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        value={dirPostInput}
                        onChange={e => setDirPostInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && dirPostInput.trim()) {
                            const id = dirPostInput.trim().replace(/.*\/posts\//, '');
                            if (id && !dirPriorityPosts.includes(id)) {
                              setDirPriorityPosts(prev => [...prev, id]);
                            }
                            setDirPostInput('');
                          }
                        }}
                        placeholder="Paste post URL or ID"
                        style={{ flex: 1, padding: '5px 8px', borderRadius: '4px', border: '1px solid var(--border-dim, rgba(255,255,255,0.08))', backgroundColor: 'var(--bg-elevated, #181b22)', color: 'var(--text-primary, #d4d1cc)', fontFamily: 'var(--font-mono, monospace)', fontSize: '10px' }}
                      />
                      <button
                        onClick={() => {
                          const id = dirPostInput.trim().replace(/.*\/posts\//, '');
                          if (id && !dirPriorityPosts.includes(id)) {
                            setDirPriorityPosts(prev => [...prev, id]);
                          }
                          setDirPostInput('');
                        }}
                        style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid var(--border-dim, rgba(255,255,255,0.08))', backgroundColor: 'transparent', color: 'var(--text-secondary, #8a8780)', fontFamily: 'var(--font-mono, monospace)', fontSize: '9px', cursor: 'pointer', letterSpacing: '0.06em' }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </DirectionField>

                {/* Submolt Focus */}
                <DirectionField label="Submolt Focus">
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {(agent.config.targetSubmolts ?? []).map(s => (
                      <button
                        key={s}
                        onClick={() => setDirSubmoltFocus(prev => prev === s ? '' : s)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          border: `1px solid ${dirSubmoltFocus === s ? 'var(--accent-teal, #5a9e8f)' : 'var(--border-dim, rgba(255,255,255,0.08))'}`,
                          backgroundColor: dirSubmoltFocus === s ? 'rgba(90,158,143,0.1)' : 'transparent',
                          color: dirSubmoltFocus === s ? 'var(--accent-teal, #5a9e8f)' : 'var(--text-secondary, #8a8780)',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '10px',
                          cursor: 'pointer',
                          transition: 'all 120ms ease',
                        }}
                      >
                        m/{s}
                      </button>
                    ))}
                    {dirSubmoltFocus && (
                      <span style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '10px', color: 'var(--text-ghost, #3a3834)', alignSelf: 'center' }}>70% bias</span>
                    )}
                  </div>
                </DirectionField>

                {/* Extra Keywords */}
                <DirectionField label="Extra Keywords (High)">
                  <DirectionTagInput
                    tags={dirExtraHigh}
                    onChange={setDirExtraHigh}
                    placeholder="High-priority keywords"
                  />
                </DirectionField>
                <DirectionField label="Extra Keywords (Medium)">
                  <DirectionTagInput
                    tags={dirExtraMedium}
                    onChange={setDirExtraMedium}
                    placeholder="Medium-priority keywords"
                  />
                </DirectionField>

                {/* Push / Clear buttons */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                  <button
                    disabled={dirPushState === 'pushing'}
                    onClick={async () => {
                      const token = getRailwayToken();
                      if (!token) {
                        setDirPushError('No Railway token set.');
                        setDirPushState('error');
                        return;
                      }
                      const direction = {
                        contextNotes: dirContextNotes,
                        focusTopics: dirFocusTopics,
                        priorityPosts: dirPriorityPosts,
                        submoltFocus: dirSubmoltFocus,
                        extraKeywordsHigh: dirExtraHigh,
                        extraKeywordsMedium: dirExtraMedium,
                        lastPushedAt: new Date().toISOString(),
                      };
                      updateDirection(agent.id, direction);
                      const merged = mergeDirectionIntoEnvVars(envVars, direction);
                      setDirPushState('pushing');
                      setDirPushError('');
                      try {
                        const resp = await fetch('/api/railway-push', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            envVars: merged,
                            railwayToken: token,
                            projectId: agent.railwayConfig!.projectId,
                            serviceId: agent.railwayConfig!.serviceId,
                            environmentId: agent.railwayConfig!.environmentId,
                          }),
                        });
                        const data = await resp.json();
                        if (data.ok) {
                          addLogEntry(agent.id, 'Direction pushed to Railway');
                          setDirPushState('success');
                          setTimeout(() => setDirPushState('idle'), 4000);
                        } else {
                          setDirPushError(data.error ?? 'Push failed');
                          setDirPushState('error');
                        }
                      } catch (e) {
                        setDirPushError(e instanceof Error ? e.message : 'Network error');
                        setDirPushState('error');
                      }
                    }}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '5px',
                      border: `1px solid ${dirPushState === 'success' ? 'var(--accent-teal, #5a9e8f)' : 'var(--accent-amber, #c4956a)'}`,
                      backgroundColor: 'transparent',
                      color: dirPushState === 'success' ? 'var(--accent-teal, #5a9e8f)' : 'var(--accent-amber, #c4956a)',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '10px',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      cursor: dirPushState === 'pushing' ? 'wait' : 'pointer',
                    }}
                  >
                    {dirPushState === 'pushing' ? 'Pushing…' : dirPushState === 'success' ? '✓ Pushed' : 'Push Direction'}
                  </button>
                  <button
                    onClick={async () => {
                      setDirContextNotes('');
                      setDirFocusTopics([]);
                      setDirPriorityPosts([]);
                      setDirSubmoltFocus('');
                      setDirExtraHigh([]);
                      setDirExtraMedium([]);
                      updateDirection(agent.id, undefined);
                      const token = getRailwayToken();
                      if (!token || !agent.railwayConfig) return;
                      const cleared = mergeDirectionIntoEnvVars(envVars, {
                        contextNotes: '',
                        focusTopics: [],
                        priorityPosts: [],
                        submoltFocus: '',
                        extraKeywordsHigh: [],
                        extraKeywordsMedium: [],
                      });
                      setDirPushState('pushing');
                      try {
                        const resp = await fetch('/api/railway-push', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            envVars: cleared,
                            railwayToken: token,
                            projectId: agent.railwayConfig!.projectId,
                            serviceId: agent.railwayConfig!.serviceId,
                            environmentId: agent.railwayConfig!.environmentId,
                          }),
                        });
                        const data = await resp.json();
                        if (data.ok) {
                          addLogEntry(agent.id, 'Direction cleared');
                          setDirPushState('success');
                          setTimeout(() => setDirPushState('idle'), 4000);
                        } else {
                          setDirPushState('error');
                        }
                      } catch {
                        setDirPushState('error');
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '9px',
                      color: 'var(--text-ghost, #3a3834)',
                      cursor: 'pointer',
                      letterSpacing: '0.06em',
                      textDecoration: 'underline',
                    }}
                  >
                    Clear Direction
                  </button>
                </div>
                {dirPushState === 'error' && dirPushError && (
                  <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '11px', color: 'var(--accent-rust, #a06b5a)', margin: 0, lineHeight: 1.4 }}>
                    {dirPushError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Section: LIVE ACTIVITY ──────────────────────────── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <SectionHeading noMargin>Activity</SectionHeading>
              {activityLoading && (
                <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '9px', color: 'var(--text-ghost, #3a3834)', letterSpacing: '0.06em' }}>
                  fetching…
                </span>
              )}
            </div>

            {/* Live stats */}
            {(activity?.status || activity?.profile || activity?.publicProfile) && (() => {
              const s = activity.status ?? {};
              const p = activity.profile ?? {};
              const pub = activity.publicProfile ?? {};
              // Unwrap nested .agent objects (Moltbook wraps profile data)
              const sAgent = (s.agent ?? s) as Record<string, unknown>;
              const pAgent = (p.agent ?? p) as Record<string, unknown>;
              const pubAgent = (pub.agent ?? pub) as Record<string, unknown>;
              // Merge all three sources — public profile is most likely to have stats
              const claimStatus = String(sAgent.status ?? s.status ?? pAgent.status ?? pubAgent.status ?? '—');
              const karma = pubAgent.karma ?? pAgent.karma ?? sAgent.karma;
              const rawPostCount = pubAgent.posts_count ?? pubAgent.post_count ?? pAgent.posts_count ?? pAgent.post_count ?? sAgent.posts_count;
              const rawCommentCount = pubAgent.comments_count ?? pubAgent.comment_count ?? pAgent.comments_count ?? pAgent.comment_count ?? sAgent.comments_count;
              const followers = pubAgent.follower_count ?? pubAgent.followers ?? pAgent.follower_count;
              // Moltbook API may report 0 despite having activity — use available data as floor
              const recentCommentsRaw = ((pub as Record<string, unknown>).recentComments ?? []) as unknown[];
              const recentPostsRaw = activity?.recentPosts ?? [];
              const commentDisplay = (Number(rawCommentCount) || 0) > 0
                ? String(rawCommentCount)
                : recentCommentsRaw.length > 0 ? `${recentCommentsRaw.length}+` : '0';
              const postDisplay = (Number(rawPostCount) || 0) > 0
                ? String(rawPostCount)
                : recentPostsRaw.length > 0 ? `${recentPostsRaw.length}+` : '—';
              return (
                <>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Status', value: claimStatus, highlight: claimStatus === 'claimed' ? 'teal' : claimStatus === 'pending_claim' ? 'amber' : null },
                      { label: 'Karma', value: karma !== undefined && karma !== null ? String(karma) : '—', highlight: null },
                      { label: 'Posts', value: postDisplay, highlight: null },
                      { label: 'Comments', value: commentDisplay, highlight: null },
                      ...(followers !== undefined && followers !== null ? [{ label: 'Followers', value: String(followers), highlight: null as string | null }] : []),
                    ].map(({ label, value, highlight }) => (
                      <div key={label} style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--bg-card, #1a1d25)', border: '1px solid var(--border-dim, rgba(255,255,255,0.08))' }}>
                        <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '8px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-ghost, #3a3834)', margin: '0 0 3px' }}>{label}</p>
                        <p style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '13px',
                          color: highlight === 'teal' ? 'var(--accent-teal, #5a9e8f)' : highlight === 'amber' ? 'var(--accent-amber, #c4956a)' : 'var(--text-primary, #d4d1cc)',
                          margin: 0,
                        }}>{value}</p>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}

            {/* Recent Activity (from publicProfile.recentComments + search) */}
            {(() => {
              // Gather recent comments from publicProfile
              const pubData = activity?.publicProfile ?? {};
              const recentComments = ((pubData as Record<string, unknown>).recentComments ?? []) as Record<string, unknown>[];
              // Use recentPosts from API (best available source)
              const searchPosts = (activity?.recentPosts ?? []) as Record<string, unknown>[];

              if (recentComments.length === 0 && searchPosts.length === 0) return null;

              return (
                <div style={{ marginBottom: '16px' }}>
                  {/* Recent comments */}
                  {recentComments.length > 0 && (
                    <>
                      <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '8px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-ghost, #3a3834)', margin: '0 0 8px' }}>Recent Comments</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: searchPosts.length > 0 ? '14px' : 0 }}>
                        {recentComments.slice(0, 5).map((comment, i) => {
                          const commentId = String(comment.id ?? '');
                          const content = String(comment.content ?? '').slice(0, 80);
                          const postObj = (comment.post ?? {}) as Record<string, unknown>;
                          const postId = String(postObj.id ?? '');
                          const postTitle = String(postObj.title ?? '').slice(0, 50);
                          const submoltObj = (postObj.submolt ?? {}) as Record<string, unknown>;
                          const submoltName = String(submoltObj.name ?? '');
                          const createdAt = String(comment.created_at ?? comment.createdAt ?? '');
                          const timeAgo = createdAt ? _relativeTime(createdAt) : '';
                          const votes = Number(comment.upvotes ?? 0) - Number(comment.downvotes ?? 0);

                          return (
                            <a
                              key={commentId || i}
                              href={postId ? `https://www.moltbook.com/post/${postId}` : '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                backgroundColor: 'var(--bg-card, #1a1d25)',
                                border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
                                textDecoration: 'none',
                                transition: 'border-color 120ms ease',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-active, rgba(255,255,255,0.15))'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-dim, rgba(255,255,255,0.08))'; }}
                            >
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {postTitle && (
                                  <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-sans, sans-serif)', fontSize: '11px', color: 'var(--text-tertiary, #5a5854)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    on &ldquo;{postTitle}&rdquo;
                                  </span>
                                )}
                                <span style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                  {submoltName && <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '9px', color: 'var(--text-ghost, #3a3834)' }}>m/{submoltName}</span>}
                                  {timeAgo && <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '9px', color: 'var(--text-ghost, #3a3834)' }}>{timeAgo}</span>}
                                  {votes !== 0 && <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '9px', color: votes > 0 ? 'var(--accent-teal, #5a9e8f)' : 'var(--accent-rust, #a06b5a)' }}>{votes > 0 ? '+' : ''}{votes}</span>}
                                </span>
                              </div>
                              <span style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '12px', color: 'var(--text-primary, #d4d1cc)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {content}
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Published posts archive */}
                  {searchPosts.length > 0 && (
                    <>
                      <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '8px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-ghost, #3a3834)', margin: '0 0 8px' }}>Published Posts <span style={{ color: 'var(--text-ghost, #3a3834)', fontWeight: 'normal' }}>({searchPosts.length})</span></p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
                        {searchPosts.map((post, i) => {
                          const postId = String(post.id ?? post.post_id ?? '');
                          const title = String(post.title ?? '').slice(0, 60) || 'Untitled';
                          const rawSubmolt = post.submolt ?? post.submolt_name ?? '';
                          const submolt = typeof rawSubmolt === 'object' && rawSubmolt !== null
                            ? String((rawSubmolt as Record<string, unknown>).name ?? '')
                            : String(rawSubmolt);
                          const score = Number(post.score ?? post.karma ?? post.upvotes ?? 0);
                          const createdAt = post.created_at ?? post.createdAt ?? post.timestamp ?? '';
                          const timeAgo = createdAt ? _relativeTime(String(createdAt)) : '';

                          return (
                            <a
                              key={postId || i}
                              href={postId ? `https://www.moltbook.com/post/${postId}` : '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'flex',
                                gap: '10px',
                                alignItems: 'center',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                backgroundColor: 'var(--bg-card, #1a1d25)',
                                border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
                                textDecoration: 'none',
                                transition: 'border-color 120ms ease',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-active, rgba(255,255,255,0.15))'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-dim, rgba(255,255,255,0.08))'; }}
                            >
                              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', color: 'var(--accent-amber, #c4956a)', flexShrink: 0, minWidth: '28px', textAlign: 'right' }}>{score}</span>
                              <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-sans, sans-serif)', fontSize: '12px', color: 'var(--text-primary, #d4d1cc)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
                              {submolt && <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '9px', color: 'var(--text-ghost, #3a3834)', flexShrink: 0 }}>m/{submolt}</span>}
                              {timeAgo && <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '9px', color: 'var(--text-ghost, #3a3834)', flexShrink: 0 }}>{timeAgo}</span>}
                            </a>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* Profile link */}
            <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: 'var(--bg-elevated, #181b22)', border: '1px solid var(--border-subtle, rgba(255,255,255,0.04))', marginBottom: '16px' }}>
              <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '12px', color: 'var(--text-tertiary, #5a5854)', margin: '0 0 8px', lineHeight: 1.5 }}>
                View full activity on the Moltbook profile page.
              </p>
              <a
                href={`https://www.moltbook.com/u/${encodeURIComponent(agent.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '10px',
                  color: 'var(--accent-teal, #5a9e8f)',
                  textDecoration: 'none',
                  letterSpacing: '0.04em',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'; }}
              >
                moltbook.com/u/{agent.name} ↗
              </a>
            </div>

            {/* Builder log */}
            {agent.log?.length > 0 && (
              <div>
                <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '8px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-ghost, #3a3834)', margin: '0 0 8px' }}>Builder Log</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {[...agent.log].reverse().map((entry, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '9px', color: 'var(--text-ghost, #3a3834)', flexShrink: 0, paddingTop: '2px', letterSpacing: '0.04em' }}>
                        {new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <span style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '11px', color: 'var(--text-tertiary, #5a5854)', lineHeight: 1.4 }}>
                        {entry.event}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div
          style={{
            flexShrink: 0,
            padding: '16px 28px',
            borderTop: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
            display: 'flex',
            gap: '10px',
            justifyContent: 'space-between',
          }}
        >
          <FooterButton
            variant="outline"
            onClick={() => {
              onClose();
              router.push(`/builder?edit=${agent.id}`);
            }}
          >
            Edit Agent →
          </FooterButton>
          <FooterButton
            variant="danger"
            onClick={() => {
              if (!confirm(`Delete agent "${agent.name}"? This cannot be undone.`)) return;
              deleteAgent(agent.id);
              onClose();
              onDeleted?.();
            }}
          >
            Delete
          </FooterButton>
        </div>
      </div>
    </>
  );
}

/* ── Helpers ────────────────────────────────────────────────────── */

function _relativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 0) return '';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  } catch {
    return '';
  }
}

/* ── Sub-components ─────────────────────────────────────────────── */

function SectionHeading({
  children,
  noMargin,
}: {
  children: React.ReactNode;
  noMargin?: boolean;
}) {
  return (
    <p
      style={{
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: '9px',
        fontWeight: 600,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--text-ghost, #3a3834)',
        margin: noMargin ? 0 : '0 0 10px 0',
      }}
    >
      {children}
    </p>
  );
}

function ConfigTile({
  label,
  value,
  fullWidth,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div
      style={{
        gridColumn: fullWidth ? '1 / -1' : undefined,
        padding: '12px 14px',
        borderRadius: '8px',
        backgroundColor: 'var(--bg-card, #1a1d25)',
        border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '9px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-ghost, #3a3834)',
          margin: '0 0 5px 0',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-sans, sans-serif)',
          fontSize: '13px',
          color: 'var(--text-primary, #d4d1cc)',
          margin: 0,
          lineHeight: 1.4,
          wordBreak: 'break-word',
        }}
      >
        {value}
      </p>
    </div>
  );
}

function FooterButton({
  children,
  variant,
  onClick,
}: {
  children: React.ReactNode;
  variant: 'outline' | 'danger';
  onClick: () => void;
}) {
  const borderColor =
    variant === 'danger'
      ? 'var(--accent-rust, #a06b5a)'
      : 'var(--border-active, rgba(255,255,255,0.15))';
  const color =
    variant === 'danger'
      ? 'var(--accent-rust, #a06b5a)'
      : 'var(--text-secondary, #8a8780)';
  const hoverBg =
    variant === 'danger'
      ? 'var(--accent-rust-dim, rgba(160,107,90,0.12))'
      : 'var(--bg-elevated, #181b22)';

  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 20px',
        borderRadius: '6px',
        border: `1px solid ${borderColor}`,
        backgroundColor: 'transparent',
        color,
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'background-color 120ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = hoverBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {children}
    </button>
  );
}

function DirectionField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '9px', letterSpacing: '0.08em', color: 'var(--text-ghost, #3a3834)', margin: '0 0 6px', textTransform: 'uppercase' }}>{label}</p>
      {children}
    </div>
  );
}

function DirectionTagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState('');

  function add() {
    const trimmed = input.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: tags.length ? '6px' : 0 }}>
        {tags.map(tag => (
          <span
            key={tag}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-elevated, #181b22)',
              border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '10px',
              color: 'var(--text-secondary, #8a8780)',
            }}
          >
            {tag}
            <button
              onClick={() => onChange(tags.filter(t => t !== tag))}
              style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', color: 'var(--text-ghost, #3a3834)', cursor: 'pointer', lineHeight: 1 }}
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder={placeholder}
        style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid var(--border-dim, rgba(255,255,255,0.08))', backgroundColor: 'var(--bg-elevated, #181b22)', color: 'var(--text-primary, #d4d1cc)', fontFamily: 'var(--font-mono, monospace)', fontSize: '10px', boxSizing: 'border-box' }}
      />
    </div>
  );
}

function TweetBlock({ tweet }: { tweet: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(tweet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div>
      <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-ghost, #3a3834)', margin: '0 0 6px' }}>
        Step 2 — Post this tweet on X / Twitter
      </p>
      <div
        style={{
          padding: '10px 12px',
          borderRadius: '6px',
          backgroundColor: 'var(--bg-card, #1a1d25)',
          border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
          fontFamily: 'var(--font-sans, sans-serif)',
          fontSize: '12px',
          color: 'var(--text-secondary, #8a8780)',
          lineHeight: 1.55,
          whiteSpace: 'pre-wrap',
          marginBottom: '8px',
        }}
      >
        {tweet}
      </div>
      <button
        onClick={handleCopy}
        style={{
          padding: '5px 12px',
          borderRadius: '5px',
          border: '1px solid rgba(196,149,106,0.3)',
          backgroundColor: 'transparent',
          color: copied ? 'var(--accent-teal, #5a9e8f)' : 'var(--accent-amber, #c4956a)',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '10px',
          letterSpacing: '0.05em',
          cursor: 'pointer',
          transition: 'color 120ms ease',
        }}
      >
        {copied ? '✓ Copied' : 'Copy tweet'}
      </button>
      <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '11px', color: 'var(--text-ghost, #3a3834)', margin: '8px 0 0', lineHeight: 1.4 }}>
        Your agent cannot post until this tweet is verified. Claim status updates on the next cycle (~2 hours).
      </p>
    </div>
  );
}
