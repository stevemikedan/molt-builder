'use client';

import { useState } from 'react';
import { CharacterConfig } from '@/types/character';
import { buildEnvVars } from '@/lib/buildEnvVars';
import { EnvVarTable } from '@/components/EnvVarTable';
import { getRailwayToken } from '@/lib/railwayStorage';
import { StoredAgent, addLogEntry } from '@/lib/agentStorage';

interface Props {
  config: CharacterConfig;
  userApiKey: string;
  onSave: () => void;
  isEditMode?: boolean;
  agentId?: string;
  railwayConfig?: StoredAgent['railwayConfig'];
}

type PushState = 'idle' | 'pushing' | 'success' | 'error';

export function Step7Deploy({ config, userApiKey, onSave, isEditMode, agentId, railwayConfig }: Props) {
  const envVars = buildEnvVars(config, userApiKey);
  const railwayUrl = process.env.NEXT_PUBLIC_RAILWAY_TEMPLATE_URL ?? '#';
  const hasAnthropicKey = !!userApiKey?.trim();
  const [pushState, setPushState] = useState<PushState>('idle');
  const [pushError, setPushError] = useState('');

  const preFilled = hasAnthropicKey ? 13 : 12;

  async function handleRailwayPush() {
    const token = getRailwayToken();
    if (!token || !railwayConfig) return;
    setPushState('pushing');
    setPushError('');
    try {
      const resp = await fetch('/api/railway-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          envVars,
          railwayToken: token,
          projectId: railwayConfig.projectId,
          serviceId: railwayConfig.serviceId,
          environmentId: railwayConfig.environmentId,
        }),
      });
      const data = await resp.json();
      if (data.ok) {
        if (agentId) addLogEntry(agentId, 'Pushed updated config to Railway');
        setPushState('success');
        setTimeout(() => {
          onSave(); // redirect to dashboard after success
        }, 1200);
      } else {
        setPushError(data.error ?? 'Push failed');
        setPushState('error');
      }
    } catch (e) {
      setPushError(e instanceof Error ? e.message : 'Network error');
      setPushState('error');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '720px' }}>

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
          Step 7 — Deploy
        </p>
        <p style={{
          fontFamily: 'var(--font-serif, serif)',
          fontSize: '22px',
          fontWeight: 500,
          color: 'var(--text-primary, #d4d1cc)',
          margin: '0 0 8px',
        }}>
          {isEditMode ? 'Apply your changes' : 'Your agent is ready to deploy'}
        </p>
        <p style={{
          fontFamily: 'var(--font-sans, sans-serif)',
          fontSize: '14px',
          color: 'var(--text-secondary, #8a8780)',
          margin: 0,
          lineHeight: 1.6,
        }}>
          {isEditMode
            ? 'Copy the updated env vars below and paste them into Railway. Your agent will redeploy automatically.'
            : preFilled === 13
              ? 'All 13 environment variables are pre-filled from your builder selections — nothing to re-enter.'
              : '12 of 13 environment variables are pre-filled from your builder selections. You\'ll add your Anthropic API key in Railway.'}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div style={{
          padding: '14px 18px',
          borderRadius: '8px',
          backgroundColor: 'var(--bg-card, #1a1d25)',
          border: '1px solid rgba(90,158,143,0.25)',
        }}>
          <p style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '22px',
            fontWeight: 600,
            color: 'var(--accent-teal, #5a9e8f)',
            margin: '0 0 2px',
          }}>
            {preFilled} / 13
          </p>
          <p style={{
            fontFamily: 'var(--font-sans, sans-serif)',
            fontSize: '12px',
            color: 'var(--text-tertiary, #5a5854)',
            margin: 0,
          }}>
            Variables pre-filled from builder
          </p>
        </div>
        <div style={{
          padding: '14px 18px',
          borderRadius: '8px',
          backgroundColor: 'var(--bg-card, #1a1d25)',
          border: hasAnthropicKey
            ? '1px solid rgba(90,158,143,0.25)'
            : '1px solid rgba(196,149,106,0.25)',
        }}>
          <p style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '22px',
            fontWeight: 600,
            color: hasAnthropicKey ? 'var(--accent-teal, #5a9e8f)' : 'var(--accent-amber, #c4956a)',
            margin: '0 0 2px',
          }}>
            {hasAnthropicKey ? '✓' : '1'}
          </p>
          <p style={{
            fontFamily: 'var(--font-sans, sans-serif)',
            fontSize: '12px',
            color: 'var(--text-tertiary, #5a5854)',
            margin: 0,
          }}>
            {hasAnthropicKey ? 'Anthropic key included' : 'Anthropic key to add in Railway'}
          </p>
        </div>
      </div>

      {/* Env var table */}
      <div>
        <p style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '9px',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--text-ghost, #3a3834)',
          margin: '0 0 10px',
        }}>
          Environment Variables
        </p>
        <EnvVarTable vars={envVars} />
      </div>

      {/* Deploy instructions */}
      <div style={{
        padding: '20px 24px',
        borderRadius: '10px',
        backgroundColor: 'var(--bg-card, #1a1d25)',
        border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
      }}>
        {isEditMode && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{
              fontFamily: 'var(--font-serif, serif)',
              fontSize: '16px',
              fontWeight: 500,
              color: 'var(--text-primary, #d4d1cc)',
              margin: '0 0 12px',
            }}>
              How to apply changes
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { n: '1', title: 'Copy all as .env', body: 'Click the "Copy all as .env" button above to copy the updated variables block.' },
                { n: '2', title: 'Open your Railway service', body: 'Go to your existing agent service in Railway. Open Variables → Raw Editor.' },
                { n: '3', title: 'Paste and redeploy', body: 'Select all existing variables, paste the copied block, then click Deploy. Railway redeploys automatically.' },
              ].map((s) => (
                <div key={s.n} style={{ display: 'flex', gap: '16px' }}>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', color: 'var(--text-ghost, #3a3834)', flexShrink: 0, paddingTop: '1px', width: '14px' }}>{s.n}.</span>
                  <div>
                    <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary, #d4d1cc)', margin: '0 0 3px' }}>{s.title}</p>
                    <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '12px', color: 'var(--text-secondary, #8a8780)', margin: 0, lineHeight: 1.6 }}>{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {!isEditMode && (
          <>
            <p style={{
              fontFamily: 'var(--font-serif, serif)',
              fontSize: '16px',
              fontWeight: 500,
              color: 'var(--text-primary, #d4d1cc)',
              margin: '0 0 16px',
            }}>
              How to deploy
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '22px' }}>
              {[
                {
                  n: '1',
                  title: 'Copy all as .env',
                  body: 'Click the "Copy all as .env" button above. This copies all your variables in a single block, with multi-line values correctly formatted.',
                },
                {
                  n: '2',
                  title: 'Click Deploy on Railway',
                  body: 'The button below opens the agent template. Connect your GitHub account when prompted — Railway uses this to fork the template repo.',
                },
                {
                  n: '3',
                  title: 'Open Railway\'s Raw Editor',
                  body: 'In the Variables section, click the "Raw Editor" icon (top right of the variables panel). Paste the copied block. All 12 pre-filled variables appear instantly.',
                },
                {
                  n: '4',
                  title: hasAnthropicKey ? 'Deploy' : 'Add your Anthropic API key, then deploy',
                  body: hasAnthropicKey
                    ? 'Your Anthropic API key is already in the pasted block. Click Deploy.'
                    : 'Find ANTHROPIC_API_KEY in the variables list and paste your key from console.anthropic.com. Then click Deploy.',
                },
              ].map((step) => (
                <div key={step.n} style={{ display: 'flex', gap: '16px' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '11px',
                    color: 'var(--text-ghost, #3a3834)',
                    flexShrink: 0,
                    paddingTop: '1px',
                    width: '14px',
                  }}>
                    {step.n}.
                  </span>
                  <div>
                    <p style={{
                      fontFamily: 'var(--font-sans, sans-serif)',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--text-primary, #d4d1cc)',
                      margin: '0 0 3px',
                    }}>
                      {step.title}
                    </p>
                    <p style={{
                      fontFamily: 'var(--font-sans, sans-serif)',
                      fontSize: '12px',
                      color: 'var(--text-secondary, #8a8780)',
                      margin: 0,
                      lineHeight: 1.6,
                    }}>
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Railway button */}
            <a href={railwayUrl} target="_blank" rel="noopener noreferrer">
              <img
                src="https://railway.app/button.svg"
                alt="Deploy on Railway"
                style={{ height: '40px' }}
              />
            </a>
            {railwayUrl === '#' && (
              <p style={{
                fontFamily: 'var(--font-sans, sans-serif)',
                fontSize: '12px',
                color: 'var(--accent-amber, #c4956a)',
                margin: '10px 0 0',
              }}>
                Railway template URL not configured — set NEXT_PUBLIC_RAILWAY_TEMPLATE_URL in your Vercel environment variables.
              </p>
            )}
          </>
        )}
      </div>

      {/* What happens next */}
      <div style={{
        padding: '16px 20px',
        borderRadius: '8px',
        backgroundColor: 'var(--bg-elevated, #181b22)',
        border: '1px solid var(--border-subtle, rgba(255,255,255,0.04))',
      }}>
        <p style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '9px',
          fontWeight: 600,
          color: 'var(--text-ghost, #3a3834)',
          margin: '0 0 10px',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
        }}>
          After deploying
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            'Railway builds the agent from the template repository.',
            'Your agent starts, fetches its heartbeat instructions, then checks claim status.',
            'If not yet claimed, it waits and retries each cycle (~4 hours). Open Railway Logs to confirm.',
            `Search for ${config.name} on moltbook.com to see your agent's profile once active.`,
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px' }}>
              <span style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '9px',
                color: 'var(--text-ghost, #3a3834)',
                flexShrink: 0,
                paddingTop: '2px',
                width: '12px',
              }}>
                {i + 1}.
              </span>
              <p style={{
                fontFamily: 'var(--font-sans, sans-serif)',
                fontSize: '12px',
                color: 'var(--text-tertiary, #5a5854)',
                margin: 0,
                lineHeight: 1.5,
              }}>
                {item}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Claim reminder */}
      {config.claimUrl && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '8px',
          backgroundColor: 'rgba(196,149,106,0.06)',
          border: '1px solid rgba(196,149,106,0.2)',
        }}>
          <p style={{
            fontFamily: 'var(--font-sans, sans-serif)',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--accent-amber, #c4956a)',
            margin: '0 0 4px',
          }}>
            Don&apos;t forget to claim your agent
          </p>
          <p style={{
            fontFamily: 'var(--font-sans, sans-serif)',
            fontSize: '12px',
            color: 'var(--text-secondary, #8a8780)',
            margin: 0,
            lineHeight: 1.5,
          }}>
            Your agent won&apos;t post until you verify ownership. Visit your claim URL, verify your email, then post the provided tweet from your X account.{' '}
            <a
              href={config.claimUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent-amber, #c4956a)', textDecoration: 'underline', wordBreak: 'break-all' }}
            >
              {config.claimUrl}
            </a>
          </p>
        </div>
      )}

      {/* Save */}
      <div>
        <p style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '9px',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--text-ghost, #3a3834)',
          margin: '0 0 10px',
        }}>
          Save to Dashboard
        </p>
        <p style={{
          fontFamily: 'var(--font-sans, sans-serif)',
          fontSize: '13px',
          color: 'var(--text-secondary, #8a8780)',
          margin: '0 0 16px',
          lineHeight: 1.6,
        }}>
          Persist this agent to your dashboard. Your env vars, API key, and claim link are saved and accessible any time.
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={onSave}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              borderRadius: '6px',
              border: '1px solid var(--accent-amber, #c4956a)',
              backgroundColor: 'transparent',
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
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--accent-amber-dim, rgba(196,149,106,0.12))';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
          >
            Save &amp; view dashboard →
          </button>

          {isEditMode && railwayConfig && getRailwayToken() && (
            <button
              disabled={pushState === 'pushing'}
              onClick={handleRailwayPush}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 20px',
                borderRadius: '6px',
                border: `1px solid ${pushState === 'success' ? 'var(--accent-teal, #5a9e8f)' : pushState === 'error' ? 'var(--accent-rust, #a06b5a)' : 'var(--accent-teal, #5a9e8f)'}`,
                backgroundColor: 'transparent',
                color: pushState === 'success' ? 'var(--accent-teal, #5a9e8f)' : pushState === 'error' ? 'var(--accent-rust, #a06b5a)' : 'var(--accent-teal, #5a9e8f)',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: pushState === 'pushing' ? 'wait' : 'pointer',
              }}
            >
              {pushState === 'pushing' ? 'Pushing…' : pushState === 'success' ? '✓ Applied to Railway' : 'Apply to Railway →'}
            </button>
          )}
        </div>
        {pushState === 'error' && pushError && (
          <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: '12px', color: 'var(--accent-rust, #a06b5a)', margin: '8px 0 0', lineHeight: 1.4 }}>
            {pushError}
          </p>
        )}
      </div>
    </div>
  );
}
