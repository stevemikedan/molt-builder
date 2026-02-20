import { CharacterConfig } from '@/types/character';
import { EnvVarMap } from '@/lib/buildEnvVars';

export type AgentStatus = 'pending' | 'ready';

export interface AgentLogEntry {
  timestamp: string; // ISO 8601
  event: string;
}

export interface StoredAgent {
  id: string;
  createdAt: string;
  name: string;
  description: string;
  status: AgentStatus;
  /** Present on pending agents — holds claim/tweet data so it isn't lost */
  pendingInfo?: {
    claimUrl: string;
    tweetTemplate: string;
  };
  config: CharacterConfig;
  envVars: EnvVarMap;
  accentColor: string; // 'amber' | 'teal' | 'violet' | 'rust' | 'slate' | 'bone'
  sigil: string;
  log: AgentLogEntry[];
}

const ACCENT_COLORS = ['amber', 'teal', 'violet', 'rust', 'slate', 'bone'] as const;
const STORAGE_KEY = 'molt_agents_v1';

export function getAgents(): StoredAgent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAgent[]) : [];
  } catch {
    return [];
  }
}

function _write(agents: StoredAgent[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
}

function _logEntry(event: string): AgentLogEntry {
  return { timestamp: new Date().toISOString(), event };
}

/**
 * Called immediately after Step 5 registration.
 * Preserves API key (in envVars), claim URL, and tweet template
 * so the user doesn't lose registration data if they close the tab.
 */
export function savePendingAgent(
  config: CharacterConfig,
  envVars: EnvVarMap,
  claimUrl: string,
  tweetTemplate: string,
): StoredAgent {
  const existing = getAgents();
  const idx = existing.findIndex(a => a.name === config.name);
  const base = idx >= 0 ? existing[idx] : null;

  const agent: StoredAgent = {
    id: base?.id ?? `agent_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: base?.createdAt ?? new Date().toISOString(),
    name: config.name,
    description: config.description,
    status: 'pending',
    pendingInfo: { claimUrl, tweetTemplate },
    config,
    envVars,
    accentColor: base?.accentColor ?? ACCENT_COLORS[existing.filter((_, i) => i !== idx).length % ACCENT_COLORS.length],
    sigil: config.name.charAt(0).toUpperCase(),
    log: [
      ...(base?.log ?? []),
      _logEntry('Registered on Moltbook — pending claim'),
    ],
  };

  if (idx >= 0) {
    existing[idx] = agent;
  } else {
    existing.push(agent);
  }
  _write(existing);
  return agent;
}

/**
 * Called when the user clicks "Save & view dashboard" in Step 7.
 * Upgrades an existing pending agent to ready, or creates a new record.
 */
export function saveAgent(config: CharacterConfig, envVars: EnvVarMap): StoredAgent {
  const existing = getAgents();
  const idx = existing.findIndex(a => a.name === config.name);
  const base = idx >= 0 ? existing[idx] : null;

  const agent: StoredAgent = {
    id: base?.id ?? `agent_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: base?.createdAt ?? new Date().toISOString(),
    name: config.name,
    description: config.description,
    status: 'ready',
    pendingInfo: base?.pendingInfo, // keep claim info for reference
    config,
    envVars,
    accentColor: base?.accentColor ?? ACCENT_COLORS[existing.filter((_, i) => i !== idx).length % ACCENT_COLORS.length],
    sigil: config.name.charAt(0).toUpperCase(),
    log: [
      ...(base?.log ?? []),
      _logEntry('Configuration saved — ready to deploy on Railway'),
    ],
  };

  if (idx >= 0) {
    existing[idx] = agent;
  } else {
    existing.push(agent);
  }
  _write(existing);
  return agent;
}

export function addLogEntry(id: string, event: string): void {
  const agents = getAgents();
  const idx = agents.findIndex(a => a.id === id);
  if (idx < 0) return;
  agents[idx] = {
    ...agents[idx],
    log: [...(agents[idx].log ?? []), _logEntry(event)],
  };
  _write(agents);
}

export function deleteAgent(id: string): void {
  _write(getAgents().filter(a => a.id !== id));
}
