import { CharacterConfig } from '@/types/character';

export interface EnvVarMap {
  MOLTBOOK_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  AGENT_NAME: string;
  AGENT_DESCRIPTION: string;
  AGENT_CORE_NATURE: string;
  AGENT_VOICE_RULES: string;
  AGENT_EXAMPLE_POSTS: string;
  AGENT_TOPIC_KEYWORDS_HIGH: string;
  AGENT_TOPIC_KEYWORDS_MEDIUM: string;
  AGENT_TARGET_SUBMOLTS: string;
  LOG_LEVEL: string;
  SYNTHESIS_CYCLE_EVERY: string;
  CYCLE_INTERVAL_HOURS: string;
  TAVILY_API_KEY: string;
  REPLY_TO_COMMENTS: string;
  REPLY_MAX_PER_CYCLE: string;
  DIRECTION_FOCUS_TOPICS: string;
  DIRECTION_PRIORITY_POSTS: string;
  DIRECTION_SUBMOLT_FOCUS: string;
  DIRECTION_EXTRA_KEYWORDS_HIGH: string;
  DIRECTION_EXTRA_KEYWORDS_MEDIUM: string;
}

/**
 * Convert a CharacterConfig into the environment variable map
 * used by the molt-agent-template Railway deployment.
 *
 * If userApiKey is provided (entered during preview), it is pre-filled
 * into ANTHROPIC_API_KEY so the user doesn't have to paste it again in Railway.
 * Otherwise a placeholder is shown.
 */
export function buildEnvVars(config: CharacterConfig, userApiKey?: string): EnvVarMap {
  return {
    MOLTBOOK_API_KEY: config.moltbookApiKey ?? '',
    ANTHROPIC_API_KEY: userApiKey?.trim() || '<your-anthropic-api-key>',
    AGENT_NAME: config.name,
    AGENT_DESCRIPTION: config.description,
    AGENT_CORE_NATURE: config.coreNature,
    AGENT_VOICE_RULES: config.voiceRules.join('\n'),
    AGENT_EXAMPLE_POSTS: config.examplePosts.join('\n'),
    AGENT_TOPIC_KEYWORDS_HIGH: config.keywordsHigh.join(','),
    AGENT_TOPIC_KEYWORDS_MEDIUM: config.keywordsMedium.join(','),
    AGENT_TARGET_SUBMOLTS: config.targetSubmolts.join(','),
    LOG_LEVEL: 'INFO',
    SYNTHESIS_CYCLE_EVERY: String(config.synthesisEvery ?? 0),
    CYCLE_INTERVAL_HOURS: String(config.cycleIntervalHours ?? 2),
    TAVILY_API_KEY: config.tavilyApiKey ?? '',
    REPLY_TO_COMMENTS: String(config.replyToComments ?? true),
    REPLY_MAX_PER_CYCLE: String(config.replyMaxPerCycle ?? 2),
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
    DIRECTION_FOCUS_TOPICS: direction.focusTopics.join(','),
    DIRECTION_PRIORITY_POSTS: direction.priorityPosts.join(','),
    DIRECTION_SUBMOLT_FOCUS: direction.submoltFocus,
    DIRECTION_EXTRA_KEYWORDS_HIGH: direction.extraKeywordsHigh.join(','),
    DIRECTION_EXTRA_KEYWORDS_MEDIUM: direction.extraKeywordsMedium.join(','),
  };
}
