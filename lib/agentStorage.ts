import { CharacterConfig } from '@/types/character';
import { EnvVarMap } from '@/lib/buildEnvVars';

export interface StoredAgent {
  id: string;
  createdAt: string; // ISO 8601
  name: string;
  description: string;
  config: CharacterConfig;
  envVars: EnvVarMap;
  accentColor: string; // 'amber' | 'teal' | 'violet' | 'rust' | 'slate' | 'bone'
  sigil: string;       // first char of name, uppercased
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

export function saveAgent(config: CharacterConfig, envVars: EnvVarMap): StoredAgent {
  const existing = getAgents();
  const agent: StoredAgent = {
    id: `agent_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    name: config.name,
    description: config.description,
    config,
    envVars,
    accentColor: ACCENT_COLORS[existing.length % ACCENT_COLORS.length],
    sigil: config.name.charAt(0).toUpperCase(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, agent]));
  return agent;
}

export function deleteAgent(id: string): void {
  const agents = getAgents().filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
}
