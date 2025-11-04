import { Prompt } from './types';

export const COMMON_APP_PROMPTS: Prompt[] = [
  {
    id: 'identity',
    title: 'Background, Identity, Interest, or Talent',
    fullText: 'Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it. If this sounds like you, then please share your story.',
    description: 'Share something central to who you are',
    icon: '📋',
    bestFor: 'Stories about who you are at your core—your culture, passions, or unique perspectives',
  },
  {
    id: 'challenge',
    title: 'Challenge, Setback, or Failure',
    fullText: 'The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?',
    description: 'Describe overcoming a difficulty',
    icon: '💪',
    bestFor: 'Stories about overcoming difficulty, learning from mistakes, or personal growth',
  },
  {
    id: 'belief',
    title: 'Questioning or Challenging a Belief',
    fullText: 'Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?',
    description: 'Explore changing your perspective',
    icon: '💡',
    bestFor: 'Stories about intellectual curiosity, changing your mind, or standing up for what you believe',
  },
  {
    id: 'choice',
    title: 'Topic of Your Choice',
    fullText: 'Share an essay on any topic of your choice. It can be one you\'ve already written, one that responds to a different prompt, or one of your own design.',
    description: 'Write about anything meaningful to you',
    icon: '✨',
    bestFor: 'Unique stories that don\'t fit other prompts—be creative!',
  },
];

export const getPromptById = (id: string): Prompt | undefined => {
  return COMMON_APP_PROMPTS.find(p => p.id === id);
};

