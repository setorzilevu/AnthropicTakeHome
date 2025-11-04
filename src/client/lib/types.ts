// Prompt types
export type PromptId = 'challenge' | 'identity' | 'belief' | 'choice';

export interface Prompt {
  id: PromptId;
  title: string;
  fullText: string;
  description: string;
  icon: string;
  bestFor: string;
}

// Conversation types
export interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  questionStage: QuestionStage;
}

export type QuestionStage = 
  | 'Q1_EXPLORATION'
  | 'Q2_SELECTION'
  | 'Q3_SPECIFIC_MOMENT'
  | 'Q4_DILEMMA'
  | 'Q5_ACTION'
  | 'Q6_DISCOVERY'
  | 'Q7_FUTURE'
  | 'FOLLOWUP'
  | 'COMPLETE';

export interface ConversationState {
  promptId: PromptId;
  currentStage: QuestionStage;
  messages: Message[];
  studentResponses: Record<string, string>; // stage -> response
  needsFollowUp: boolean;
  progressPercentage: number;
}

// Outline types
export interface OutlineSection {
  id: string;
  title: string;
  icon?: string; // Optional - no longer used in outline display
  content: string;
  canRefine: boolean;
}

export interface Outline {
  sections: OutlineSection[];
  explanation?: string; // Explanation of why the outline was structured this way
  followUpPrompt?: string; // Prompt for student to submit essay for review
  generatedAt: Date;
  promptId: PromptId;
}

// Session types
export interface BrainstormSession {
  id: string;
  conversation: ConversationState;
  outline?: Outline;
  createdAt: Date;
  updatedAt: Date;
}

