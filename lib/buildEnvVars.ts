import { CharacterConfig } from '@/types/character';

export interface EnvVarMap {
  MOLTBOOK_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  LLM_PROVIDER: string;
  LLM_API_KEY: string;
  AGENT_NAME: string;
  AGENT_DESCRIPTION: string;
  AGENT_CORE_NATURE: string;
  AGENT_VOICE_RULES: string;
  AGENT_EXAMPLE_POSTS: string;
  AGENT_TOPIC_KEYWORDS_HIGH: string;
  AGENT_TOPIC_KEYWORDS_MEDIUM: string;
  AGENT_TARGET_SUBMOLTS: string;
  STATE_DIR: string;
  LOG_LEVEL: string;
  SYNTHESIS_CYCLE_EVERY: string;
  CYCLE_INTERVAL_HOURS: string;
  TAVILY_API_KEY: string;
  REPLY_TO_COMMENTS: string;
  REPLY_MAX_PER_CYCLE: string;
  DIRECTION_CONTEXT_NOTES: string;
  DIRECTION_FOCUS_TOPICS: string;
  DIRECTION_PRIORITY_POSTS: string;
  DIRECTION_SUBMOLT_FOCUS: string;
  DIRECTION_EXTRA_KEYWORDS_HIGH: string;
  DIRECTION_EXTRA_KEYWORDS_MEDIUM: string;
}

/** Default values for every env var key — used to backfill agents created before new keys were added. */
export const ENV_VAR_DEFAULTS: EnvVarMap = {
  MOLTBOOK_API_KEY: '',
  ANTHROPIC_API_KEY: '<your-anthropic-api-key>',
  LLM_PROVIDER: '',
  LLM_API_KEY: '<your-llm-api-key>',
  AGENT_NAME: '',
  AGENT_DESCRIPTION: '',
  AGENT_CORE_NATURE: '',
  AGENT_VOICE_RULES: '',
  AGENT_EXAMPLE_POSTS: '',
  AGENT_TOPIC_KEYWORDS_HIGH: '',
  AGENT_TOPIC_KEYWORDS_MEDIUM: '',
  AGENT_TARGET_SUBMOLTS: '',
  STATE_DIR: '/data',
  LOG_LEVEL: 'INFO',
  SYNTHESIS_CYCLE_EVERY: '0',
  CYCLE_INTERVAL_HOURS: '2',
  TAVILY_API_KEY: '',
  REPLY_TO_COMMENTS: 'true',
  REPLY_MAX_PER_CYCLE: '2',
  DIRECTION_CONTEXT_NOTES: '',
  DIRECTION_FOCUS_TOPICS: '',
  DIRECTION_PRIORITY_POSTS: '',
  DIRECTION_SUBMOLT_FOCUS: '',
  DIRECTION_EXTRA_KEYWORDS_HIGH: '',
  DIRECTION_EXTRA_KEYWORDS_MEDIUM: '',
};

/** Fill missing keys in a partial env var map with defaults. */
export function withDefaults(partial: Partial<EnvVarMap>): EnvVarMap {
  return { ...ENV_VAR_DEFAULTS, ...partial };
}

/**
 * Convert a CharacterConfig into the environment variable map
 * used by the molt-agent-template Railway deployment.
 *
 * If userApiKey is provided (entered during preview), it is pre-filled
 * into ANTHROPIC_API_KEY so the user doesn't have to paste it again in Railway.
 * Otherwise a placeholder is shown.
 */
export function buildEnvVars(config: CharacterConfig, userApiKey?: string, userProvider?: string): EnvVarMap {
  const provider = userProvider || config.llmProvider || 'anthropic';
  const isAnthropic = provider === 'anthropic';
  return {
    MOLTBOOK_API_KEY: config.moltbookApiKey ?? '',
    ANTHROPIC_API_KEY: isAnthropic ? (userApiKey?.trim() || '<your-anthropic-api-key>') : '',
    LLM_PROVIDER: isAnthropic ? '' : provider,
    LLM_API_KEY: isAnthropic ? '' : (userApiKey?.trim() || '<your-llm-api-key>'),
    AGENT_NAME: config.name,
    AGENT_DESCRIPTION: config.description,
    AGENT_CORE_NATURE: config.coreNature,
    AGENT_VOICE_RULES: config.voiceRules.join('\n'),
    AGENT_EXAMPLE_POSTS: config.examplePosts.join('\n'),
    AGENT_TOPIC_KEYWORDS_HIGH: config.keywordsHigh.join(','),
    AGENT_TOPIC_KEYWORDS_MEDIUM: config.keywordsMedium.join(','),
    AGENT_TARGET_SUBMOLTS: config.targetSubmolts.join(','),
    STATE_DIR: '/data',
    LOG_LEVEL: 'INFO',
    SYNTHESIS_CYCLE_EVERY: String(config.synthesisEvery ?? 0),
    CYCLE_INTERVAL_HOURS: String(config.cycleIntervalHours ?? 2),
    TAVILY_API_KEY: config.tavilyApiKey ?? '',
    REPLY_TO_COMMENTS: String(config.replyToComments ?? true),
    REPLY_MAX_PER_CYCLE: String(config.replyMaxPerCycle ?? 2),
    DIRECTION_CONTEXT_NOTES: '',
    DIRECTION_FOCUS_TOPICS: '',
    DIRECTION_PRIORITY_POSTS: '',
    DIRECTION_SUBMOLT_FOCUS: '',
    DIRECTION_EXTRA_KEYWORDS_HIGH: '',
    DIRECTION_EXTRA_KEYWORDS_MEDIUM: '',
  };
}

export function mergeDirectionIntoEnvVars(
  envVars: EnvVarMap,
  direction?: {
    contextNotes?: string;
    focusTopics: string[];
    priorityPosts: string[];
    submoltFocus: string;
    extraKeywordsHigh: string[];
    extraKeywordsMedium: string[];
  },
): EnvVarMap {
  if (!direction) return envVars;
  return {
    ...envVars,
    DIRECTION_CONTEXT_NOTES: direction.contextNotes || '',
    DIRECTION_FOCUS_TOPICS: direction.focusTopics.join(','),
    DIRECTION_PRIORITY_POSTS: direction.priorityPosts.join(','),
    DIRECTION_SUBMOLT_FOCUS: direction.submoltFocus,
    DIRECTION_EXTRA_KEYWORDS_HIGH: direction.extraKeywordsHigh.join(','),
    DIRECTION_EXTRA_KEYWORDS_MEDIUM: direction.extraKeywordsMedium.join(','),
  };
}
