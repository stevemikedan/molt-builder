'use client';

import { useState } from 'react';
import { EnvVarMap } from '@/lib/buildEnvVars';

interface EnvVarTableProps {
  vars: EnvVarMap;
}

// Only ANTHROPIC_API_KEY requires manual entry — everything else is pre-filled from the builder
const MANUAL_KEYS = new Set(['ANTHROPIC_API_KEY']);
// Mask these in the UI display
const SENSITIVE_KEYS = new Set(['MOLTBOOK_API_KEY', 'ANTHROPIC_API_KEY']);

/**
 * Format a key=value pair for .env file output.
 * Wraps values in double quotes when they contain whitespace, newlines, or special chars.
 * python-dotenv (used in the agent template) parses this correctly.
 */
function formatEnvLine(key: string, value: string): string {
  if (value.includes('\n') || value.includes(' ') || value.includes('"') || value.includes("'") || value.includes('#') || value.includes('$') || value.includes('`')) {
    // Escape backslashes first, then other special chars, then convert actual newlines to \n sequences.
    // python-dotenv interprets \n inside double-quoted values as actual newline characters.
    // Using escape sequences (not literal newlines) keeps each variable on one line,
    // which is safe for Railway's Raw Editor parser.
    const escaped = value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\r\n/g, '\\n')
      .replace(/\n/g, '\\n');
    return `${key}="${escaped}"`;
  }
  return `${key}=${value}`;
}

export function EnvVarTable({ vars }: EnvVarTableProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [allCopied, setAllCopied] = useState(false);

  async function copyValue(key: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  async function copyAll() {
    const text = Object.entries(vars)
      .map(([k, v]) => formatEnvLine(k, v))
      .join('\n');
    await navigator.clipboard.writeText(text);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  }

  const entries = Object.entries(vars) as [keyof EnvVarMap, string][];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Table */}
      <div style={{
        borderRadius: '10px',
        border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-card, #1a1d25)',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr 60px',
          borderBottom: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
          backgroundColor: 'var(--bg-elevated, #181b22)',
        }}>
          <div style={{ padding: '8px 14px' }}>
            <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '9px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-ghost, #3a3834)', margin: 0 }}>
              Variable
            </p>
          </div>
          <div style={{ padding: '8px 14px', borderLeft: '1px solid var(--border-subtle, rgba(255,255,255,0.04))' }}>
            <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '9px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-ghost, #3a3834)', margin: 0 }}>
              Value
            </p>
          </div>
          <div />
        </div>

        {/* Rows */}
        {entries.map(([key, value], i) => {
          const isManual = MANUAL_KEYS.has(key);
          const isSensitive = SENSITIVE_KEYS.has(key);
          const isPlaceholder = value.startsWith('<') && value.endsWith('>');
          const isEmpty = !value || isPlaceholder;
          const isLast = i === entries.length - 1;
          const isMultiLine = value.includes('\n');

          const displayValue = (isSensitive && value && !isPlaceholder)
            ? '•'.repeat(Math.min(value.length, 28))
            : value;

          return (
            <div
              key={key}
              style={{
                display: 'grid',
                gridTemplateColumns: '220px 1fr 60px',
                borderBottom: isLast ? 'none' : '1px solid var(--border-subtle, rgba(255,255,255,0.04))',
                alignItems: 'flex-start',
              }}
            >
              {/* Key column */}
              <div style={{
                padding: '10px 14px',
                borderRight: '1px solid var(--border-subtle, rgba(255,255,255,0.04))',
              }}>
                <p style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '11px',
                  color: 'var(--text-primary, #d4d1cc)',
                  margin: '0 0 3px',
                  letterSpacing: '0.02em',
                }}>
                  {key}
                </p>
                {isManual ? (
                  <p style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '8px',
                    fontWeight: 600,
                    color: 'var(--accent-amber, #c4956a)',
                    margin: 0,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}>
                    required
                  </p>
                ) : (
                  <p style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '8px',
                    fontWeight: 600,
                    color: 'var(--accent-teal, #5a9e8f)',
                    margin: 0,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}>
                    pre-filled
                  </p>
                )}
              </div>

              {/* Value column */}
              <div style={{ padding: '10px 14px', minWidth: 0 }}>
                {isMultiLine ? (
                  <pre style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '10px',
                    color: isEmpty ? 'var(--text-ghost, #3a3834)' : 'var(--text-secondary, #8a8780)',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    lineHeight: 1.5,
                  }}>
                    {isEmpty ? '(empty)' : displayValue}
                  </pre>
                ) : (
                  <p style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '11px',
                    color: isEmpty
                      ? 'var(--text-ghost, #3a3834)'
                      : isManual
                        ? 'var(--accent-amber, #c4956a)'
                        : 'var(--text-secondary, #8a8780)',
                    margin: 0,
                    wordBreak: 'break-all',
                    lineHeight: 1.5,
                  }}>
                    {isEmpty ? '(add your key in Railway)' : displayValue}
                  </p>
                )}
              </div>

              {/* Copy button */}
              <div style={{ padding: '8px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                <button
                  onClick={() => copyValue(key, value)}
                  disabled={isEmpty || isManual}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-dim, rgba(255,255,255,0.08))',
                    backgroundColor: copiedKey === key ? 'rgba(90,158,143,0.1)' : 'transparent',
                    color: (isEmpty || isManual)
                      ? 'var(--text-ghost, #3a3834)'
                      : copiedKey === key
                        ? 'var(--accent-teal, #5a9e8f)'
                        : 'var(--text-tertiary, #5a5854)',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '10px',
                    cursor: (isEmpty || isManual) ? 'not-allowed' : 'pointer',
                    transition: 'all 120ms ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {copiedKey === key ? '✓' : 'copy'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Copy all row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <button
          onClick={copyAll}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '6px',
            border: `1px solid ${allCopied ? 'rgba(90,158,143,0.4)' : 'var(--border-dim, rgba(255,255,255,0.08))'}`,
            backgroundColor: allCopied ? 'rgba(90,158,143,0.1)' : 'transparent',
            color: allCopied ? 'var(--accent-teal, #5a9e8f)' : 'var(--text-secondary, #8a8780)',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.04em',
            cursor: 'pointer',
            transition: 'all 120ms ease',
            flexShrink: 0,
          }}
        >
          {allCopied ? '✓ Copied' : 'Copy all as .env'}
        </button>
        <p style={{
          fontFamily: 'var(--font-sans, sans-serif)',
          fontSize: '12px',
          color: 'var(--text-tertiary, #5a5854)',
          margin: 0,
          lineHeight: 1.5,
        }}>
          Paste into Railway&apos;s Raw Editor to fill all variables at once
        </p>
      </div>
    </div>
  );
}
