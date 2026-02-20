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

export type SidebarView = 'agents' | 'guide';

interface SidebarProps {
  agents: StoredAgent[];
  activeAgentId: string | null;
  onSelectAgent: (id: string) => void;
  activeView: SidebarView;
  onSelectNav: (view: SidebarView) => void;
}

export default function Sidebar({ agents, activeAgentId, onSelectAgent, activeView, onSelectNav }: SidebarProps) {
  return (
    <aside
      style={{
        width: '260px',
        flexShrink: 0,
        height: '100%',
        backgroundColor: 'var(--bg-surface, #111318)',
        borderRight: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* ── NAVIGATION section ─────────────────────────────────── */}
      <div style={{ padding: '20px 16px 8px' }}>
        <p
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '9px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text-ghost, #3a3834)',
            marginBottom: '6px',
          }}
        >
          Navigation
        </p>

        <NavItem
          label="My Agents"
          badge={agents.length}
          active={activeView === 'agents'}
          onClick={() => onSelectNav('agents')}
        />
        <NavItem
          label="Deploy Guide"
          active={activeView === 'guide'}
          onClick={() => onSelectNav('guide')}
        />
      </div>

      {/* ── Divider ────────────────────────────────────────────── */}
      <div
        style={{
          height: '1px',
          backgroundColor: 'var(--border-subtle, rgba(255,255,255,0.04))',
          margin: '8px 16px',
        }}
      />

      {/* ── DEPLOYED section ───────────────────────────────────── */}
      <div style={{ padding: '8px 16px 20px', flex: 1 }}>
        <p
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '9px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text-ghost, #3a3834)',
            marginBottom: '6px',
          }}
        >
          Deployed
        </p>

        {agents.length === 0 && (
          <p
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '11px',
              color: 'var(--text-tertiary, #5a5854)',
              padding: '8px 4px',
            }}
          >
            No agents yet
          </p>
        )}

        {agents.map((agent) => (
          <AgentListItem
            key={agent.id}
            agent={agent}
            isActive={agent.id === activeAgentId}
            onClick={() => onSelectAgent(agent.id)}
            accentColor={ACCENT_MAP[agent.accentColor] ?? ACCENT_MAP.amber}
          />
        ))}
      </div>
    </aside>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

interface NavItemProps {
  label: string;
  badge?: number;
  active: boolean;
  onClick: () => void;
}

function NavItem({ label, badge, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '7px 10px',
        borderRadius: '6px',
        border: 'none',
        backgroundColor: active
          ? 'var(--bg-elevated, #181b22)'
          : 'transparent',
        color: active
          ? 'var(--text-primary, #d4d1cc)'
          : 'var(--text-secondary, #8a8780)',
        fontFamily: 'var(--font-sans, sans-serif)',
        fontSize: '13px',
        fontWeight: active ? 500 : 400,
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'background-color 120ms ease, color 120ms ease',
        marginBottom: '2px',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'var(--bg-elevated, #181b22)';
          e.currentTarget.style.color = 'var(--text-primary, #d4d1cc)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--text-secondary, #8a8780)';
        }
      }}
    >
      <span>{label}</span>
      {badge !== undefined && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '18px',
            height: '18px',
            padding: '0 5px',
            borderRadius: '9px',
            backgroundColor: 'var(--bg-card, #1a1d25)',
            border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '10px',
            color: 'var(--text-tertiary, #5a5854)',
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

interface AgentListItemProps {
  agent: StoredAgent;
  isActive: boolean;
  onClick: () => void;
  accentColor: string;
}

function AgentListItem({ agent, isActive, onClick, accentColor }: AgentListItemProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        width: '100%',
        padding: '7px 10px',
        borderRadius: '6px',
        border: isActive
          ? '1px solid var(--border-active, rgba(255,255,255,0.15))'
          : '1px solid transparent',
        backgroundColor: isActive
          ? 'var(--bg-elevated, #181b22)'
          : 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
        marginBottom: '2px',
        transition: 'background-color 120ms ease, border-color 120ms ease',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'var(--bg-elevated, #181b22)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {/* Accent dot */}
      <span
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          backgroundColor: accentColor,
          flexShrink: 0,
          opacity: 0.85,
        }}
      />

      {/* Name + status */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: 'var(--font-sans, sans-serif)',
            fontSize: '12px',
            fontWeight: isActive ? 500 : 400,
            color: isActive
              ? 'var(--text-primary, #d4d1cc)'
              : 'var(--text-secondary, #8a8780)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {agent.name}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '9px',
            color: 'var(--text-tertiary, #5a5854)',
            margin: 0,
            marginTop: '1px',
            letterSpacing: '0.05em',
          }}
        >
          deployed
        </p>
      </div>
    </button>
  );
}
