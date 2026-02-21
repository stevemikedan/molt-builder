'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StoredAgent, deleteAgent, updateRailwayConfig, addLogEntry } from '@/lib/agentStorage';
import { getRailwayToken } from '@/lib/railwayStorage';
import { EnvVarMap } from '@/lib/buildEnvVars';

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
            <ConfigTile label="Post Schedule" value="Every 4h ±20min" />
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
              {copied ? 'Copied!' : 'Copy all as .env'}
            </button>
          </div>

          <div
            style={{
              borderRadius: '8px',
              border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
              overflow: 'hidden',
              marginBottom: '28px',
            }}
          >
            {Object.entries(envVars).map(([key, value], i) => {
              const isApiKey = key === 'MOLTBOOK_API_KEY';
              const isAnthropicKey = key === 'ANTHROPIC_API_KEY';
              const displayValue = isApiKey
                ? maskValue(key, value)
                : value;
              const isPlaceholder = isAnthropicKey && value === '<your-anthropic-api-key>';

              return (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '9px 14px',
                    borderBottom:
                      i < Object.keys(envVars).length - 1
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
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '10px',
                      color: isPlaceholder
                        ? 'var(--text-tertiary, #5a5854)'
                        : 'var(--text-secondary, #8a8780)',
                      fontStyle: isPlaceholder ? 'italic' : 'normal',
                      wordBreak: 'break-all',
                      flex: 1,
                    }}
                  >
                    {isPlaceholder ? '⟨set your Anthropic API key here⟩' : displayValue || '—'}
                  </span>
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
              Deploy via Railway using the env vars above. Create a new project
              from the{' '}
              <a
                href="https://railway.app"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent-teal, #5a9e8f)', textDecoration: 'none' }}
              >
                Railway dashboard
              </a>
              , add the <code
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '11px',
                  backgroundColor: 'var(--bg-elevated, #181b22)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                }}
              >molt-agent-template</code> repo, and paste in the env vars copied above.
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
              <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '12px', color: 'var(--text-tertiary, #5a5854)', margin: '0 0 12px', lineHeight: 1.5 }}>
                Connect a Railway service to push env vars and redeploy without copy-paste.
              </p>
              <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '9px', color: 'var(--text-ghost, #3a3834)', margin: '0 0 4px', letterSpacing: '0.08em' }}>
                Project ID
              </p>
              <input
                value={rwProjectId}
                onChange={e => setRwProjectId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                style={{ width: '100%', marginBottom: '10px', padding: '7px 10px', borderRadius: '5px', border: '1px solid var(--border-dim, rgba(255,255,255,0.08))', backgroundColor: 'var(--bg-elevated, #181b22)', color: 'var(--text-primary, #d4d1cc)', fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', boxSizing: 'border-box' }}
              />
              <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '9px', color: 'var(--text-ghost, #3a3834)', margin: '0 0 4px', letterSpacing: '0.08em' }}>
                Service ID
              </p>
              <input
                value={rwServiceId}
                onChange={e => setRwServiceId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                style={{ width: '100%', marginBottom: '10px', padding: '7px 10px', borderRadius: '5px', border: '1px solid var(--border-dim, rgba(255,255,255,0.08))', backgroundColor: 'var(--bg-elevated, #181b22)', color: 'var(--text-primary, #d4d1cc)', fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', boxSizing: 'border-box' }}
              />
              <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '9px', color: 'var(--text-ghost, #3a3834)', margin: '0 0 4px', letterSpacing: '0.08em' }}>
                Environment ID (default: production)
              </p>
              <input
                value={rwEnvironmentId}
                onChange={e => setRwEnvironmentId(e.target.value)}
                placeholder="production"
                style={{ width: '100%', marginBottom: '12px', padding: '7px 10px', borderRadius: '5px', border: '1px solid var(--border-dim, rgba(255,255,255,0.08))', backgroundColor: 'var(--bg-elevated, #181b22)', color: 'var(--text-primary, #d4d1cc)', fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', boxSizing: 'border-box' }}
              />
              <button
                disabled={!rwProjectId.trim() || !rwServiceId.trim()}
                onClick={() => {
                  updateRailwayConfig(agent.id, {
                    projectId: rwProjectId.trim(),
                    serviceId: rwServiceId.trim(),
                    environmentId: rwEnvironmentId.trim() || 'production',
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
                  opacity: (!rwProjectId.trim() || !rwServiceId.trim()) ? 0.4 : 1,
                }}
              >
                Connect
              </button>
              <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '11px', color: 'var(--text-ghost, #3a3834)', margin: '8px 0 0', lineHeight: 1.4 }}>
                IDs are in your Railway service URL: railway.app/project/[projectId]/service/[serviceId]
              </p>
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
            {(activity?.status || activity?.profile) && (() => {
              const s = activity.status ?? {};
              const p = activity.profile ?? {};
              const claimStatus = String(s.status ?? p.status ?? '—');
              const karma = s.karma ?? p.karma ?? s.score ?? p.score;
              const postCount = s.post_count ?? p.post_count ?? s.posts ?? p.posts;
              const commentCount = s.comment_count ?? p.comment_count ?? s.comments ?? p.comments;
              return (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Status', value: claimStatus, highlight: claimStatus === 'claimed' ? 'teal' : claimStatus === 'pending_claim' ? 'amber' : null },
                    { label: 'Karma', value: karma !== undefined ? String(karma) : '—', highlight: null },
                    { label: 'Posts', value: postCount !== undefined ? String(postCount) : '—', highlight: null },
                    { label: 'Comments', value: commentCount !== undefined ? String(commentCount) : '—', highlight: null },
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
              );
            })()}

            {/* Post/comment history note */}
            <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: 'var(--bg-elevated, #181b22)', border: '1px solid var(--border-subtle, rgba(255,255,255,0.04))', marginBottom: '16px' }}>
              <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '12px', color: 'var(--text-tertiary, #5a5854)', margin: '0 0 8px', lineHeight: 1.5 }}>
                Moltbook doesn&apos;t expose a post/comment history API. View full activity on the profile page.
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
        Your agent cannot post until this tweet is verified. Claim status updates on the next cycle (~4 hours).
      </p>
    </div>
  );
}
