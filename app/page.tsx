'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StoredAgent, getAgents } from '@/lib/agentStorage';
import AppHeader from '@/components/AppHeader';
import Sidebar from '@/components/Sidebar';
import AgentCard from '@/components/AgentCard';
import AgentDetailPanel from '@/components/AgentDetailPanel';

export default function DashboardPage() {
  const [agents, setAgents] = useState<StoredAgent[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setAgents(getAgents());
  }, []);

  const activeAgent = agents.find(a => a.id === activeId) ?? null;

  function handleDeleted() {
    const refreshed = getAgents();
    setAgents(refreshed);
    setActiveId(null);
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <AppHeader onNewAgent={() => router.push('/builder')} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          agents={agents}
          activeAgentId={activeId}
          onSelectAgent={(id) => setActiveId(prev => prev === id ? null : id)}
        />

        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '36px 40px',
          }}
        >
          {agents.length === 0 ? (
            <EmptyState onNewAgent={() => router.push('/builder')} />
          ) : (
            <>
              <p
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '10px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--text-ghost, #3a3834)',
                  marginBottom: '20px',
                }}
              >
                My Agents &middot; {agents.length}
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '16px',
                  maxWidth: '1100px',
                }}
              >
                {agents.map((agent, i) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    index={i}
                    onClick={() => setActiveId(prev => prev === agent.id ? null : agent.id)}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {activeAgent && (
        <AgentDetailPanel
          agent={activeAgent}
          onClose={() => setActiveId(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}

function EmptyState({ onNewAgent }: { onNewAgent: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        gap: '20px',
      }}
    >
      <svg
        viewBox="0 0 80 80"
        width="64"
        height="64"
        fill="none"
        style={{ opacity: 0.2 }}
      >
        <circle cx="40" cy="40" r="36" stroke="var(--accent-amber, #c4956a)" strokeWidth="1" />
        <circle cx="40" cy="40" r="20" stroke="var(--accent-amber, #c4956a)" strokeWidth="0.75" />
        <circle cx="40" cy="40" r="5" fill="var(--accent-amber, #c4956a)" opacity="0.6" />
      </svg>

      <div>
        <p
          style={{
            fontFamily: 'var(--font-serif, serif)',
            fontSize: '24px',
            fontWeight: 500,
            color: 'var(--text-primary, #d4d1cc)',
            margin: '0 0 8px',
          }}
        >
          No agents yet
        </p>
        <p
          style={{
            fontFamily: 'var(--font-sans, sans-serif)',
            fontSize: '14px',
            color: 'var(--text-tertiary, #5a5854)',
            margin: 0,
            maxWidth: '320px',
          }}
        >
          Build your first Moltbook agent. It will appear here after you complete
          the wizard.
        </p>
      </div>

      <button
        onClick={onNewAgent}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
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
          transition: 'background-color 150ms ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            'var(--accent-amber-dim, rgba(196,149,106,0.12))';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
        }}
      >
        Build your first agent &rarr;
      </button>
    </div>
  );
}
