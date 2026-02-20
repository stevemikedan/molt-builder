'use client';

import { StoredAgent } from '@/lib/agentStorage';

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

interface AgentCardProps {
  agent: StoredAgent;
  onClick: () => void;
  index: number;
}

function daysSince(isoDate: string): number {
  const created = new Date(isoDate).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
}

export default function AgentCard({ agent, onClick, index }: AgentCardProps) {
  const accentColor = ACCENT_MAP[agent.accentColor] ?? ACCENT_MAP.amber;
  const accentDim   = ACCENT_DIM_MAP[agent.accentColor] ?? ACCENT_DIM_MAP.amber;
  const age         = daysSince(agent.createdAt);
  const truncDesc   = agent.description.length > 150
    ? agent.description.slice(0, 150) + '…'
    : agent.description;
  const submolts    = (agent.config.targetSubmolts ?? []).slice(0, 4);
  const kwCount     = (agent.config.keywordsHigh ?? []).length + (agent.config.keywordsMedium ?? []).length;

  return (
    <>
      {/* Keyframe injection — React deduplicates identical style tags */}
      <style>{`
        @keyframes molt-card-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .molt-agent-card {
          animation: molt-card-in 320ms ease both;
          transition: transform 160ms ease, box-shadow 160ms ease;
        }
        .molt-agent-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45), 0 0 0 1px var(--border-active, rgba(255,255,255,0.15));
        }
      `}</style>

      <div
        className="molt-agent-card"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
        style={{
          animationDelay: `${index * 60}ms`,
          backgroundColor: 'var(--bg-card, #1a1d25)',
          border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
          borderRadius: '10px',
          overflow: 'hidden',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {/* Colored top accent bar */}
        <div
          style={{
            height: '3px',
            backgroundColor: accentColor,
            opacity: 0.9,
          }}
        />

        {/* Card body */}
        <div style={{ padding: '20px 22px' }}>

          {/* Header row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '13px',
              marginBottom: '14px',
            }}
          >
            {/* Sigil circle */}
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: accentDim,
                border: `1px solid ${accentColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontFamily: 'var(--font-serif, serif)',
                fontSize: '18px',
                fontWeight: 600,
                color: accentColor,
              }}
            >
              {agent.sigil}
            </div>

            {/* Name + class + status */}
            <div style={{ flex: 1, minWidth: 0, paddingTop: '1px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginBottom: '3px',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-serif, serif)',
                    fontSize: '17px',
                    fontWeight: 500,
                    color: 'var(--text-primary, #d4d1cc)',
                    margin: 0,
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {agent.name}
                </p>

                {/* Status badge */}
                <span
                  style={{
                    flexShrink: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(90,158,143,0.12)',
                    border: '1px solid rgba(90,158,143,0.25)',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '9px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--accent-teal, #5a9e8f)',
                  }}
                >
                  <span
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-teal, #5a9e8f)',
                    }}
                  />
                  deployed
                </span>
              </div>

              <p
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '9px',
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--text-tertiary, #5a5854)',
                  margin: 0,
                }}
              >
                Moltbook Agent
              </p>
            </div>
          </div>

          {/* Description */}
          {truncDesc && (
            <p
              style={{
                fontFamily: 'var(--font-sans, sans-serif)',
                fontSize: '13px',
                lineHeight: 1.55,
                color: 'var(--text-secondary, #8a8780)',
                margin: '0 0 14px 0',
              }}
            >
              {truncDesc}
            </p>
          )}

          {/* Traits / submolt pills */}
          {submolts.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                marginBottom: '16px',
              }}
            >
              {submolts.map((s) => (
                <span
                  key={s}
                  style={{
                    display: 'inline-block',
                    padding: '3px 9px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-elevated, #181b22)',
                    border: '1px solid var(--border-subtle, rgba(255,255,255,0.04))',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '10px',
                    color: 'var(--text-tertiary, #5a5854)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Meta row */}
          <div
            style={{
              borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.04))',
              paddingTop: '12px',
              display: 'flex',
              gap: '18px',
            }}
          >
            <MetaItem label="Age" value={age === 0 ? 'today' : `${age}d`} />
            <MetaItem label="Schedule" value="Every 4h" />
            <MetaItem label="Keywords" value={String(kwCount)} />
          </div>
        </div>
      </div>
    </>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '9px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-ghost, #3a3834)',
          margin: '0 0 2px 0',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '11px',
          color: 'var(--text-tertiary, #5a5854)',
          margin: 0,
        }}
      >
        {value}
      </p>
    </div>
  );
}
