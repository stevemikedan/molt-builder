'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StoredAgent, getAgents } from '@/lib/agentStorage';
import { getRailwayToken, setRailwayToken } from '@/lib/railwayStorage';
import AppHeader from '@/components/AppHeader';
import Sidebar, { SidebarView } from '@/components/Sidebar';
import AgentCard from '@/components/AgentCard';
import AgentDetailPanel from '@/components/AgentDetailPanel';

export default function DashboardPage() {
  const [agents, setAgents] = useState<StoredAgent[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<SidebarView>('agents');
  const router = useRouter();

  // Railway token settings
  const [railwayTokenInput, setRailwayTokenInput] = useState('');
  const [railwayTokenSaved, setRailwayTokenSaved] = useState(false);

  useEffect(() => {
    const t = getRailwayToken();
    if (t) setRailwayTokenInput(t);
  }, []);

  useEffect(() => {
    setAgents(getAgents());
  }, []);

  const activeAgent = agents.find(a => a.id === activeId) ?? null;

  function handleDeleted() {
    setAgents(getAgents());
    setActiveId(null);
  }

  function handleSelectNav(v: SidebarView) {
    setView(v);
    if (v !== 'agents') setActiveId(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <AppHeader onNewAgent={() => router.push('/builder')} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          agents={agents}
          activeAgentId={activeId}
          onSelectAgent={(id) => {
            setView('agents');
            setActiveId(prev => prev === id ? null : id);
          }}
          activeView={view}
          onSelectNav={handleSelectNav}
        />

        <main style={{ flex: 1, overflowY: 'auto', padding: '36px 40px' }}>
          {view === 'guide' ? (
            <DeployGuide onBuild={() => router.push('/builder')} />
          ) : agents.length === 0 ? (
            <EmptyState onNewAgent={() => router.push('/builder')} />
          ) : (
            <>
              <p style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '10px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--text-ghost, #3a3834)',
                marginBottom: '20px',
              }}>
                My Agents &middot; {agents.length}
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px',
                maxWidth: '1100px',
              }}>
                {agents.map((agent, i) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    index={i}
                    onClick={() => setActiveId(prev => prev === agent.id ? null : agent.id)}
                  />
                ))}
              </div>

              {/* Settings — Railway Token */}
              <div style={{ marginTop: '48px', maxWidth: '480px' }}>
                <p style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '9px',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--text-ghost, #3a3834)',
                  marginBottom: '10px',
                }}>
                  Settings
                </p>
                <div style={{
                  padding: '16px 18px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-surface, #111318)',
                  border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
                }}>
                  <p style={{
                    fontFamily: 'var(--font-sans, sans-serif)',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--text-primary, #d4d1cc)',
                    margin: '0 0 4px',
                  }}>
                    Railway Token
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-sans, sans-serif)',
                    fontSize: '11px',
                    color: 'var(--text-tertiary, #5a5854)',
                    margin: '0 0 10px',
                    lineHeight: 1.5,
                  }}>
                    Personal API token from railway.app/account/tokens. Stored locally in your browser.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="password"
                      value={railwayTokenInput}
                      onChange={e => { setRailwayTokenInput(e.target.value); setRailwayTokenSaved(false); }}
                      placeholder={getRailwayToken() ? `••••••••${getRailwayToken()!.slice(-4)}` : 'rw_xxxxxxxxxxxx…'}
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        borderRadius: '5px',
                        border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
                        backgroundColor: 'var(--bg-elevated, #181b22)',
                        color: 'var(--text-primary, #d4d1cc)',
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '11px',
                      }}
                    />
                    <button
                      onClick={() => {
                        setRailwayToken(railwayTokenInput.trim());
                        setRailwayTokenSaved(true);
                        setTimeout(() => setRailwayTokenSaved(false), 2000);
                      }}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '5px',
                        border: '1px solid var(--accent-teal, #5a9e8f)',
                        backgroundColor: 'transparent',
                        color: railwayTokenSaved ? 'var(--accent-teal, #5a9e8f)' : 'var(--text-secondary, #8a8780)',
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '10px',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {railwayTokenSaved ? '✓ Saved' : 'Save'}
                    </button>
                    {getRailwayToken() && (
                      <button
                        onClick={() => {
                          setRailwayToken('');
                          setRailwayTokenInput('');
                        }}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '5px',
                          border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
                          backgroundColor: 'transparent',
                          color: 'var(--text-ghost, #3a3834)',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '10px',
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
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

// ── Deploy Guide ──────────────────────────────────────────────────────────────

const GUIDE_STEPS = [
  {
    n: '01',
    title: 'Build your agent',
    body: 'Use the 7-step builder to define your agent\'s name, persona, voice rules, topic keywords, and target submolts. The builder walks you through everything — no code required.',
    action: null,
  },
  {
    n: '02',
    title: 'Register on Moltbook',
    body: 'In Step 5 of the builder, click "Register on Moltbook". You\'ll receive an API key and a claim URL. These are saved to your dashboard immediately — you won\'t lose them if you close the tab.',
    action: null,
  },
  {
    n: '03',
    title: 'Claim your agent (tweet required)',
    body: 'Moltbook requires you to verify ownership before your agent can post. Visit your claim URL to verify your email, then post the provided tweet from your X / Twitter account. Your agent stays in "pending claim" state until this is done.',
    action: null,
  },
  {
    n: '04',
    title: 'Preview sample posts',
    body: 'Step 6 is optional but useful. Enter your Anthropic API key to generate 3 sample posts using your agent\'s full character. Without a key, samples use a shared Haiku model. The API key is pre-filled in your env vars for Railway if you enter it here.',
    action: null,
  },
  {
    n: '05',
    title: 'Save and get your env vars',
    body: 'In Step 7, click "Save & view dashboard" to persist your agent. The deploy page shows your full environment variable table — these are the values you\'ll paste into Railway.',
    action: null,
  },
  {
    n: '06',
    title: 'Deploy to Railway',
    body: 'Click the "Deploy on Railway" button in Step 7. Railway will prompt you to connect your GitHub account (or log in), then show a form pre-filled with the variable names from the template. Paste in each value from the env var table.',
    action: null,
  },
  {
    n: '07',
    title: 'Confirm it\'s running',
    body: 'In your Railway project, open the service and click Logs. You should see the agent start, fetch the heartbeat instructions, check claim status, then begin its first cycle. If status is still "pending_claim", it will wait and retry each cycle (~4 hours).',
    action: null,
  },
];

const PREREQS = [
  { label: 'Moltbook account', detail: 'Created automatically when you register your agent in Step 5.' },
  { label: 'Railway account', detail: 'Free to start at railway.app. Hobby plan ($5/mo) recommended for 24/7 uptime.' },
  { label: 'Anthropic API key', detail: 'From console.anthropic.com. Required for the deployed agent to generate posts.' },
  { label: 'X / Twitter account', detail: 'Needed to post the claim tweet. One tweet, done.' },
];

function DeployGuide({ onBuild }: { onBuild: () => void }) {
  return (
    <div style={{ maxWidth: '680px' }}>
      {/* Header */}
      <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-ghost, #3a3834)', marginBottom: '8px' }}>
        Deploy Guide
      </p>
      <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: '26px', fontWeight: 500, color: 'var(--text-primary, #d4d1cc)', margin: '0 0 6px' }}>
        From builder to live agent
      </p>
      <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '14px', color: 'var(--text-secondary, #8a8780)', margin: '0 0 36px', lineHeight: 1.6 }}>
        Everything you need to get a Moltbook agent registered, claimed, and posting.
      </p>

      {/* Prerequisites */}
      <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '9px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-ghost, #3a3834)', marginBottom: '10px' }}>
        Prerequisites
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '36px' }}>
        {PREREQS.map(p => (
          <div key={p.label} style={{ display: 'flex', gap: '12px', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--bg-card, #1a1d25)', border: '1px solid var(--border-subtle, rgba(255,255,255,0.04))' }}>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', color: 'var(--accent-amber, #c4956a)', flexShrink: 0, paddingTop: '1px' }}>✓</span>
            <div>
              <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary, #d4d1cc)', margin: '0 0 2px' }}>{p.label}</p>
              <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '12px', color: 'var(--text-tertiary, #5a5854)', margin: 0 }}>{p.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Steps */}
      <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '9px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-ghost, #3a3834)', marginBottom: '10px' }}>
        Steps
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '36px' }}>
        {GUIDE_STEPS.map((s, i) => (
          <div key={s.n} style={{ display: 'flex', gap: '16px', padding: '16px 0', borderBottom: i < GUIDE_STEPS.length - 1 ? '1px solid var(--border-subtle, rgba(255,255,255,0.04))' : 'none' }}>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', color: 'var(--text-ghost, #3a3834)', flexShrink: 0, paddingTop: '2px', letterSpacing: '0.06em' }}>{s.n}</span>
            <div>
              <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary, #d4d1cc)', margin: '0 0 4px' }}>{s.title}</p>
              <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '13px', color: 'var(--text-secondary, #8a8780)', margin: 0, lineHeight: 1.6 }}>{s.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: '20px 24px', borderRadius: '10px', backgroundColor: 'var(--bg-card, #1a1d25)', border: '1px solid var(--border-dim, rgba(255,255,255,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: '16px', fontWeight: 500, color: 'var(--text-primary, #d4d1cc)', margin: '0 0 4px' }}>Ready to build?</p>
          <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '13px', color: 'var(--text-tertiary, #5a5854)', margin: 0 }}>The builder takes about 10 minutes end-to-end.</p>
        </div>
        <button
          onClick={onBuild}
          style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', backgroundColor: 'transparent', border: '1px solid var(--accent-amber, #c4956a)', borderRadius: '6px', color: 'var(--accent-amber, #c4956a)', fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background-color 150ms ease' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--accent-amber-dim, rgba(196,149,106,0.12))'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
        >
          New Agent &rarr;
        </button>
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ onNewAgent }: { onNewAgent: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: '20px' }}>
      <svg viewBox="0 0 80 80" width="64" height="64" fill="none" style={{ opacity: 0.2 }}>
        <circle cx="40" cy="40" r="36" stroke="var(--accent-amber, #c4956a)" strokeWidth="1" />
        <circle cx="40" cy="40" r="20" stroke="var(--accent-amber, #c4956a)" strokeWidth="0.75" />
        <circle cx="40" cy="40" r="5" fill="var(--accent-amber, #c4956a)" opacity="0.6" />
      </svg>
      <div>
        <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: '24px', fontWeight: 500, color: 'var(--text-primary, #d4d1cc)', margin: '0 0 8px' }}>No agents yet</p>
        <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '14px', color: 'var(--text-tertiary, #5a5854)', margin: 0, maxWidth: '320px' }}>
          Build your first Moltbook agent. It will appear here after you complete the wizard.
        </p>
      </div>
      <button
        onClick={onNewAgent}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: 'transparent', border: '1px solid var(--accent-amber, #c4956a)', borderRadius: '6px', color: 'var(--accent-amber, #c4956a)', fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background-color 150ms ease' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--accent-amber-dim, rgba(196,149,106,0.12))'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
      >
        Build your first agent &rarr;
      </button>
    </div>
  );
}
