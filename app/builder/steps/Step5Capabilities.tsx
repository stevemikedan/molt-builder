'use client';

import { CharacterConfig } from '@/types/character';

interface Props {
  config: CharacterConfig;
  setConfig: (c: CharacterConfig) => void;
}

export function Step5Capabilities({ config, setConfig }: Props) {
  const replyOn = config.replyToComments ?? true;
  const replyMax = config.replyMaxPerCycle ?? 2;
  const synthesisOn = (config.synthesisEvery ?? 0) > 0;
  const synthesisEvery = config.synthesisEvery && config.synthesisEvery > 0 ? config.synthesisEvery : 3;
  const cycleInterval = config.cycleIntervalHours ?? 2;
  const webSearchOn = !!(config.tavilyApiKey && config.tavilyApiKey.trim() && !config.tavilyApiKey.startsWith('<'));

  const labelStyle = {
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '9px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: 'var(--text-ghost, #3a3834)',
    marginBottom: '6px',
  };

  const toggleStyle = (on: boolean) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans, sans-serif)',
    fontSize: '13px',
    color: on ? 'var(--text-primary, #d4d1cc)' : 'var(--text-tertiary, #5a5854)',
  });

  const pillStyle = (on: boolean) => ({
    width: '32px',
    height: '18px',
    borderRadius: '9px',
    backgroundColor: on ? 'var(--accent-teal, #5a9e8f)' : 'var(--bg-elevated, #181b22)',
    border: `1px solid ${on ? 'var(--accent-teal, #5a9e8f)' : 'var(--border-dim, rgba(255,255,255,0.08))'}`,
    position: 'relative' as const,
    transition: 'background-color 150ms ease',
    flexShrink: 0,
  });

  const dotStyle = (on: boolean) => ({
    position: 'absolute' as const,
    top: '2px',
    left: on ? '14px' : '2px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: 'var(--text-primary, #d4d1cc)',
    transition: 'left 150ms ease',
  });

  const inputStyle = {
    padding: '7px 10px',
    borderRadius: '5px',
    border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
    backgroundColor: 'var(--bg-elevated, #181b22)',
    color: 'var(--text-primary, #d4d1cc)',
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '12px',
    width: '100%',
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <p style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '9px',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--text-ghost, #3a3834)',
          margin: '0 0 8px',
        }}>
          Step 5 — Capabilities
        </p>
        <p style={{
          fontFamily: 'var(--font-serif, serif)',
          fontSize: '22px',
          fontWeight: 500,
          color: 'var(--text-primary, #d4d1cc)',
          margin: '0 0 8px',
        }}>
          Optional capabilities
        </p>
        <p style={{
          fontFamily: 'var(--font-sans, sans-serif)',
          fontSize: '14px',
          color: 'var(--text-secondary, #8a8780)',
          margin: 0,
          lineHeight: 1.6,
        }}>
          Configure how your agent engages.
        </p>
      </div>

      {/* Reply to comments */}
      <div style={{
        padding: '18px 20px',
        borderRadius: '10px',
        backgroundColor: 'var(--bg-card, #1a1d25)',
        border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
      }}>
        <label style={toggleStyle(replyOn)}>
          <div
            style={pillStyle(replyOn)}
            onClick={() =>
              setConfig({
                ...config,
                replyToComments: !replyOn,
              })
            }
          >
            <div style={dotStyle(replyOn)} />
          </div>
          Reply to comments
        </label>
        <p style={{
          fontFamily: 'var(--font-sans, sans-serif)',
          fontSize: '12px',
          color: 'var(--text-tertiary, #5a5854)',
          margin: '8px 0 0',
          lineHeight: 1.5,
          paddingLeft: '40px',
        }}>
          Agent checks its own recent posts for new comments and generates threaded replies. Replies count toward the daily comment limit.
        </p>

        {replyOn && (
          <div style={{ marginTop: '16px', paddingLeft: '40px' }}>
            <p style={labelStyle}>Max replies per cycle</p>
            <input
              type="number"
              min={1}
              max={5}
              value={replyMax}
              onChange={e => setConfig({ ...config, replyMaxPerCycle: Math.min(5, Math.max(1, Number(e.target.value))) })}
              style={{ ...inputStyle, width: '80px' }}
            />
            <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '11px', color: 'var(--text-ghost, #3a3834)', margin: '4px 0 0' }}>
              1–5
            </p>
          </div>
        )}
      </div>

      {/* Observation synthesis */}
      <div style={{
        padding: '18px 20px',
        borderRadius: '10px',
        backgroundColor: 'var(--bg-card, #1a1d25)',
        border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
      }}>
        <label style={toggleStyle(synthesisOn)}>
          <div
            style={pillStyle(synthesisOn)}
            onClick={() =>
              setConfig({
                ...config,
                synthesisEvery: synthesisOn ? 0 : synthesisEvery,
              })
            }
          >
            <div style={dotStyle(synthesisOn)} />
          </div>
          Observation synthesis
        </label>
        <p style={{
          fontFamily: 'var(--font-sans, sans-serif)',
          fontSize: '12px',
          color: 'var(--text-tertiary, #5a5854)',
          margin: '8px 0 0',
          lineHeight: 1.5,
          paddingLeft: '40px',
        }}>
          Agent tracks trending topics across cycles and periodically writes an analytical synthesis post — its own perspective on patterns it has observed.
        </p>

        {synthesisOn && (
          <div style={{ marginTop: '16px', paddingLeft: '40px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 140px' }}>
              <p style={labelStyle}>Synthesis every N cycles</p>
              <input
                type="number"
                min={2}
                max={10}
                value={synthesisEvery}
                onChange={e => setConfig({ ...config, synthesisEvery: Math.min(10, Math.max(2, Number(e.target.value))) })}
                style={{ ...inputStyle, width: '80px' }}
              />
              <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '11px', color: 'var(--text-ghost, #3a3834)', margin: '4px 0 0' }}>
                2–10
              </p>
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <p style={labelStyle}>Cycle interval (hours)</p>
              <input
                type="number"
                min={1}
                max={8}
                value={cycleInterval}
                onChange={e => setConfig({ ...config, cycleIntervalHours: Math.min(8, Math.max(1, Number(e.target.value))) })}
                style={{ ...inputStyle, width: '80px' }}
              />
              <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '11px', color: 'var(--text-ghost, #3a3834)', margin: '4px 0 0' }}>
                1–8
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Web search */}
      <div style={{
        padding: '18px 20px',
        borderRadius: '10px',
        backgroundColor: 'var(--bg-card, #1a1d25)',
        border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
      }}>
        <label style={toggleStyle(webSearchOn)}>
          <div
            style={pillStyle(webSearchOn)}
            onClick={() =>
              setConfig({
                ...config,
                tavilyApiKey: webSearchOn ? '' : config.tavilyApiKey ?? '',
              })
            }
          >
            <div style={dotStyle(webSearchOn)} />
          </div>
          Web search (grounds synthesis in current events)
        </label>
        <p style={{
          fontFamily: 'var(--font-sans, sans-serif)',
          fontSize: '12px',
          color: 'var(--text-tertiary, #5a5854)',
          margin: '8px 0 0',
          lineHeight: 1.5,
          paddingLeft: '40px',
        }}>
          Synthesis posts use Anthropic tool use + Tavily to search the web before writing. Requires a Tavily API key and observation synthesis to be enabled.
        </p>

        {(webSearchOn || (config.tavilyApiKey !== undefined)) && (
          <div style={{ marginTop: '16px', paddingLeft: '40px' }}>
            <p style={labelStyle}>Tavily API key</p>
            <input
              type="password"
              value={config.tavilyApiKey ?? ''}
              onChange={e => setConfig({ ...config, tavilyApiKey: e.target.value })}
              placeholder="tvly-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              style={inputStyle}
            />
            <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '11px', color: 'var(--text-ghost, #3a3834)', margin: '4px 0 0' }}>
              From app.tavily.com. Stored in your Railway env vars.
            </p>
          </div>
        )}
      </div>

      {/* Cycle interval (if synthesis is off) */}
      {!synthesisOn && (
        <div style={{
          padding: '18px 20px',
          borderRadius: '10px',
          backgroundColor: 'var(--bg-card, #1a1d25)',
          border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
        }}>
          <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary, #d4d1cc)', margin: '0 0 12px' }}>
            Cycle interval
          </p>
          <p style={labelStyle}>Hours between cycles</p>
          <input
            type="number"
            min={1}
            max={8}
            value={cycleInterval}
            onChange={e => setConfig({ ...config, cycleIntervalHours: Math.min(8, Math.max(1, Number(e.target.value))) })}
            style={{ ...inputStyle, width: '80px' }}
          />
          <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '11px', color: 'var(--text-ghost, #3a3834)', margin: '4px 0 0' }}>
            Default: 2 hours. Range: 1–8.
          </p>
        </div>
      )}
    </div>
  );
}
