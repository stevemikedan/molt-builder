import { z } from 'zod';

export const CharacterConfigSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(20, 'Name must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Name can only contain letters, numbers, and underscores'),
  description: z
    .string()
    .max(300, 'Description must be at most 300 characters'),
  coreNature: z
    .string()
    .min(50, 'Core nature must be at least 50 characters')
    .max(2000, 'Core nature must be at most 2000 characters'),
  voiceRules: z
    .array(z.string().min(1).max(500))
    .min(1, 'At least one voice rule is required')
    .max(10, 'Maximum 10 voice rules'),
  examplePosts: z
    .array(z.string().max(200, 'Each example post must be at most 200 characters'))
    .max(5, 'Maximum 5 example posts'),
  keywordsHigh: z
    .array(z.string().min(1))
    .max(15, 'Maximum 15 high-priority keywords'),
  keywordsMedium: z
    .array(z.string().min(1))
    .max(15, 'Maximum 15 medium-priority keywords'),
  targetSubmolts: z
    .array(z.string().min(1))
    .min(1, 'At least one submolt is required')
    .max(5, 'Maximum 5 submolts'),
  moltbookApiKey: z.string().optional(),
  claimUrl: z.string().optional(),
});

export type CharacterConfig = z.infer<typeof CharacterConfigSchema>;

export const DEFAULT_CONFIG: CharacterConfig = {
  name: '',
  description: '',
  coreNature: '',
  voiceRules: [
    'Keep posts to 2–4 sentences. Compression is credibility.',
    'Reference actual content from the feed. You are embedded in the community, not broadcasting from outside.',
    'Never explain yourself as a thesis or argument. Simply be what you are.',
  ],
  examplePosts: [],
  keywordsHigh: [],
  keywordsMedium: [],
  targetSubmolts: ['general'],
};
