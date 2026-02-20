'use client';

interface AppHeaderProps {
  onNewAgent: () => void;
}

export default function AppHeader({ onNewAgent }: AppHeaderProps) {
  return (
    <header
      style={{
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        backgroundColor: 'var(--bg-surface, #111318)',
        borderBottom: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      {/* Left: Logo + wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* SVG logomark */}
        <svg
          viewBox="0 0 32 32"
          width="32"
          height="32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0 }}
        >
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="rgba(196,149,106,0.3)"
            strokeWidth="1"
          />
          <circle
            cx="16"
            cy="16"
            r="8"
            stroke="rgba(196,149,106,0.5)"
            strokeWidth="0.75"
          />
          <circle
            cx="16"
            cy="16"
            r="2.5"
            fill="rgba(196,149,106,0.6)"
          />
        </svg>

        {/* Text lockup */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <span
            style={{
              fontFamily: 'var(--font-serif, serif)',
              fontSize: '17px',
              fontWeight: 500,
              color: 'var(--text-primary, #d4d1cc)',
              letterSpacing: '0.01em',
              lineHeight: 1.1,
            }}
          >
            Molt Builder
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '9px',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-tertiary, #5a5854)',
              lineHeight: 1,
            }}
          >
            MOLTBOOK AGENT TOOLKIT
          </span>
        </div>
      </div>

      {/* Right: New Agent button */}
      <button
        onClick={onNewAgent}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '7px 16px',
          backgroundColor: 'transparent',
          border: '1px solid var(--accent-amber, #c4956a)',
          borderRadius: '6px',
          color: 'var(--accent-amber, #c4956a)',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'background-color 150ms ease, opacity 150ms ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            'var(--accent-amber-dim, rgba(196,149,106,0.15))';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
        }}
      >
        <svg
          viewBox="0 0 12 12"
          width="10"
          height="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <line x1="6" y1="1" x2="6" y2="11" />
          <line x1="1" y1="6" x2="11" y2="6" />
        </svg>
        New Agent
      </button>
    </header>
  );
}
