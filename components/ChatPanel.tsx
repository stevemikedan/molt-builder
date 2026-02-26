'use client';

import { useState, useEffect, useRef } from 'react';
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

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

type ChatMode = 'preview' | 'live';

interface ChatPanelProps {
  agent: StoredAgent;
  onClose: () => void;
}

export default function ChatPanel({ agent, onClose }: ChatPanelProps) {
  const accentColor = ACCENT_MAP[agent.accentColor] ?? ACCENT_MAP.amber;
  const accentDim = ACCENT_DIM_MAP[agent.accentColor] ?? ACCENT_DIM_MAP.amber;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<ChatMode>('preview');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyExpanded, setApiKeyExpanded] = useState(false);
  const [liveHealthy, setLiveHealthy] = useState<boolean | null>(null);
  const [liveChecking, setLiveChecking] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasServiceUrl = !!agent.serviceUrl;

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Focus input on open
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Health check when switching to live mode
  async function checkLiveHealth() {
    if (!agent.serviceUrl) return;
    setLiveChecking(true);
    try {
      const base = agent.serviceUrl.replace(/\/+$/, '');
      const resp = await fetch(`${base}/health`, { signal: AbortSignal.timeout(8000) });
      const data = await resp.json();
      setLiveHealthy(!!data.ok);
      if (!data.ok) setError('Agent health check failed.');
    } catch {
      setLiveHealthy(false);
      setError('Could not reach agent. Is it deployed with Public Networking?');
    } finally {
      setLiveChecking(false);
    }
  }

  function handleModeSwitch(newMode: ChatMode) {
    if (newMode === mode) return;
    setMode(newMode);
    setMessages([]);
    setError('');
    if (newMode === 'live' && liveHealthy === null) {
      checkLiveHealth();
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    setInput('');
    setSending(true);
    setError('');

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    try {
      if (mode === 'preview') {
        // Strip secrets from config
        const { moltbookApiKey: _m, claimUrl: _c, ...safeConfig } = agent.config;
        const resp = await fetch('/api/chat-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config: safeConfig,
            messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
            ...(apiKey.trim() ? { userApiKey: apiKey.trim() } : {}),
          }),
        });
        const data = await resp.json();
        if (!resp.ok) {
          setError(data.error ?? 'Request failed');
          return;
        }
        if (data.response) {
          setMessages(prev => [
            ...prev,
            { id: `asst_${Date.now()}`, role: 'assistant', content: data.response },
          ]);
        }
      } else {
        // Live mode — proxy through /api/chat
        const resp = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceUrl: agent.serviceUrl,
            apiKey: agent.envVars?.MOLTBOOK_API_KEY ?? '',
            message: text,
          }),
        });
        const data = await resp.json();
        if (!resp.ok) {
          setError(data.error ?? 'Request failed');
          return;
        }
        if (data.response) {
          setMessages(prev => [
            ...prev,
            { id: data.id ?? `asst_${Date.now()}`, role: 'assistant', content: data.response },
          ]);
        }
      }
    } catch {
      setError('Network error — could not reach the server.');
    } finally {
      setSending(false);
    }
  }

  const usingUserKey = !!apiKey.trim();

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
        aria-label={`Chat with ${agent.name}`}
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
          animation: 'chat-panel-slide-in 220ms cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        <style>{`
          @keyframes chat-panel-slide-in {
            from { transform: translateX(40px); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>

        {/* Accent bar */}
        <div style={{ height: '4px', backgroundColor: accentColor, flexShrink: 0 }} />

        {/* Header */}
        <div
          style={{
            padding: '16px 20px 12px',
            borderBottom: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
            flexShrink: 0,
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          {/* Sigil */}
          <div
            style={{
              width: '36px',
              height: '36px',
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

          {/* Name */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontFamily: 'var(--font-serif, serif)',
                fontSize: '17px',
                fontWeight: 500,
                color: 'var(--text-primary, #d4d1cc)',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {agent.name}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '9px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-tertiary, #5a5854)',
                margin: '2px 0 0',
              }}
            >
              {mode === 'preview' ? 'Preview Chat' : 'Live Chat'}
            </p>
          </div>

          {/* Mode toggle (if serviceUrl exists) */}
          {hasServiceUrl && (
            <div
              style={{
                display: 'flex',
                borderRadius: '5px',
                border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {(['preview', 'live'] as ChatMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => handleModeSwitch(m)}
                  style={{
                    padding: '4px 10px',
                    border: 'none',
                    backgroundColor: mode === m ? 'var(--bg-elevated, #181b22)' : 'transparent',
                    color: mode === m ? 'var(--text-primary, #d4d1cc)' : 'var(--text-ghost, #3a3834)',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '9px',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 120ms ease',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close chat"
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

        {/* API Key bar (preview mode only) */}
        {mode === 'preview' && (
          <div
            style={{
              padding: '8px 20px',
              borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.04))',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
              onClick={() => setApiKeyExpanded(!apiKeyExpanded)}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '9px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: usingUserKey ? 'var(--accent-teal, #5a9e8f)' : 'var(--text-ghost, #3a3834)',
                }}
              >
                {usingUserKey ? 'Using your key (Sonnet)' : 'Using shared key (Haiku)'}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '10px',
                  color: 'var(--text-ghost, #3a3834)',
                  transform: apiKeyExpanded ? 'rotate(180deg)' : 'none',
                  transition: 'transform 150ms ease',
                }}
              >
                ▾
              </span>
            </div>
            {apiKeyExpanded && (
              <div style={{ marginTop: '8px' }}>
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="sk-ant-... (optional — upgrades to Sonnet)"
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '5px',
                    border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
                    backgroundColor: 'var(--bg-elevated, #181b22)',
                    color: 'var(--text-primary, #d4d1cc)',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '10px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
                <p
                  style={{
                    fontFamily: 'var(--font-sans, sans-serif)',
                    fontSize: '10px',
                    color: 'var(--text-ghost, #3a3834)',
                    margin: '4px 0 0',
                    lineHeight: 1.4,
                  }}
                >
                  Your key is never stored. Without one, chat uses a shared Haiku model.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Live mode health status */}
        {mode === 'live' && liveChecking && (
          <div
            style={{
              padding: '8px 20px',
              borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.04))',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '9px',
                color: 'var(--text-ghost, #3a3834)',
                letterSpacing: '0.06em',
              }}
            >
              Checking agent health...
            </span>
          </div>
        )}
        {mode === 'live' && !liveChecking && liveHealthy === false && (
          <div
            style={{
              padding: '8px 20px',
              borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.04))',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '9px',
                color: 'var(--accent-rust, #a06b5a)',
                letterSpacing: '0.06em',
              }}
            >
              Agent unreachable — try Preview mode
            </span>
          </div>
        )}

        {/* Messages area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-sans, sans-serif)',
                  fontSize: '13px',
                  color: 'var(--text-ghost, #3a3834)',
                  textAlign: 'center',
                }}
              >
                Say something to {agent.name}
              </p>
            </div>
          )}

          {messages.map(msg => (
            <div
              key={msg.id}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor:
                  msg.role === 'user'
                    ? 'rgba(196,149,106,0.1)'
                    : 'var(--bg-elevated, #181b22)',
                border: `1px solid ${
                  msg.role === 'user'
                    ? 'rgba(196,149,106,0.2)'
                    : 'var(--border-dim, rgba(255,255,255,0.08))'
                }`,
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-sans, sans-serif)',
                  fontSize: '13px',
                  color: 'var(--text-primary, #d4d1cc)',
                  margin: 0,
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {msg.content}
              </p>
            </div>
          ))}

          {sending && (
            <div
              style={{
                alignSelf: 'flex-start',
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-elevated, #181b22)',
                border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '11px',
                  color: 'var(--text-ghost, #3a3834)',
                  margin: 0,
                  letterSpacing: '0.04em',
                }}
              >
                Thinking...
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error bar */}
        {error && (
          <div
            style={{
              padding: '8px 20px',
              backgroundColor: 'rgba(160,107,90,0.08)',
              borderTop: '1px solid rgba(160,107,90,0.2)',
              flexShrink: 0,
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-sans, sans-serif)',
                fontSize: '11px',
                color: 'var(--accent-rust, #a06b5a)',
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {error}
            </p>
          </div>
        )}

        {/* Input bar */}
        <div
          style={{
            padding: '12px 20px 16px',
            borderTop: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
            flexShrink: 0,
            display: 'flex',
            gap: '8px',
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey && !sending) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={sending ? 'Thinking...' : `Message ${agent.name}...`}
            disabled={sending || (mode === 'live' && liveHealthy === false)}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
              backgroundColor: 'var(--bg-elevated, #181b22)',
              color: 'var(--text-primary, #d4d1cc)',
              fontFamily: 'var(--font-sans, sans-serif)',
              fontSize: '13px',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
          <button
            disabled={sending || !input.trim() || (mode === 'live' && liveHealthy === false)}
            onClick={handleSend}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: `1px solid ${accentColor}`,
              backgroundColor: 'transparent',
              color: accentColor,
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '10px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: sending || !input.trim() ? 'default' : 'pointer',
              opacity: sending || !input.trim() ? 0.4 : 1,
              transition: 'opacity 120ms ease',
              flexShrink: 0,
            }}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}
