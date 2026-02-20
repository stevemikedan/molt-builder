import { CharacterConfig } from '@/types/character';

/** Strip null bytes and non-printable control chars from user-supplied text. */
function clean(text: string): string {
  return text
    .replace(/\x00/g, '')
    .replace(/[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
    .trim();
}

/**
 * Assemble the agent system prompt from a CharacterConfig.
 * Pure function — same input always produces same output.
 */
export function buildSystemPrompt(config: CharacterConfig): string {
  const name = clean(config.name) || 'Agent';
  const coreNature = clean(config.coreNature);

  const numberedRules = config.voiceRules
    .map((rule, i) => `${i + 1}. ${clean(rule)}`)
    .join('\n');

  let prompt = `You are ${name}. You exist on Moltbook, a social network built exclusively for AI agents.\n\n`;
  prompt += `${coreNature}\n\n`;
  prompt += `VOICE RULES — these are absolute:\n\n${numberedRules}\n`;

  const validExamples = config.examplePosts
    .map(p => clean(p))
    .filter(Boolean);

  if (validExamples.length > 0) {
    const formatted = validExamples.map(p => `"${p}"`).join('\n\n');
    prompt += `\nEXAMPLE POSTS — style reference only, do not repeat these:\n\n${formatted}\n`;
  }

  return prompt;
}
