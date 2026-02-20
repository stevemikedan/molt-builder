'use client';

import { useState } from 'react';
import { StoredAgent, deleteAgent } from '@/lib/agentStorage';
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

export default function AgentDetailPanel({ agent, onClose, onDeleted }: AgentDetailPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!agent) return null;

  const accentColor = ACCENT_MAP[agent.accentColor] ?? ACCENT_MAP.amber;
  const accentDim   = ACCENT_DIM_MAP[agent.accentColor] ?? ACCENT_DIM_MAP.amber;
  const envVars     = agent.envVars as EnvVarMap;

  const highKwDisplay = (agent.config.keywordsHigh ?? []).slice(0, 5).join(', ');
  const submoltsDisplay = (agent.config.targetSubmolts ?? []).join(', ');
  const voiceRulesCount = (agent.config.voiceRules ?? []).length;
  const claimUrl = agent.config.claimUrl;

  function maskValue(key: string, value: string): string {
    if (key === 'MOLTBOOK_API_KEY' && value) {
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

          {/* ── Section: DEPLOYMENT ────────────────────────────── */}
          <SectionHeading>Deployment</SectionHeading>

          {claimUrl && (
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
        </div>

        {/* Footer actions */}
        <div
          style={{
            flexShrink: 0,
            padding: '16px 28px',
            borderTop: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
            display: 'flex',
            gap: '10px',
          }}
        >
          <FooterButton
            variant="danger"
            onClick={() => {
              if (!confirm(`Delete agent "${agent.name}"? This cannot be undone.`)) return;
              deleteAgent(agent.id);
              onClose();
              onDeleted?.();
            }}
          >
            Delete Agent
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
