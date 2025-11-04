import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  getStagePrompt,
  getFollowUpPrompt,
  getResponseAnalysisPrompt,
  getOutlineGenerationPrompt,
  getSectionRefinementPrompt,
} from './systemPrompts';
import { ConversationState, QuestionStage } from './types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const MODEL = 'claude-sonnet-4-5';

// ============================================================================
// Generate next question based on stage
// ============================================================================

export async function generateQuestion(
  conversation: ConversationState
): Promise<string> {
  const conversationHistory = formatConversationHistory(conversation);
  
  const systemPrompt = getStagePrompt(
    conversation.currentStage,
    conversation.promptId,
    conversationHistory
  );

  // Build a more specific user message based on the stage
  let userMessage = '';
  if (conversation.currentStage === 'Q1_EXPLORATION') {
    userMessage = 'Generate the opening question for this brainstorming session. The question should be warm, encouraging, and ask the student to list 3-4 experiences without filtering themselves. Keep it to 2-3 sentences.';
  } else if (conversation.currentStage === 'FOLLOWUP') {
    userMessage = 'Generate a gentle follow-up question that asks for more specific details. Keep it warm and non-judgmental. 2-3 sentences maximum.';
  } else {
    userMessage = `Generate the question for ${conversation.currentStage}. Use the conversation history to inform your question. The question should be warm, specific, and help the student dig deeper. Keep it to 2-3 sentences.`;
  }

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  return extractTextContent(response);
}

// ============================================================================
// Analyze student response quality
// ============================================================================

export async function analyzeResponse(
  stage: QuestionStage,
  studentResponse: string
): Promise<{
  needsFollowUp: boolean;
  category: string;
  reasoning: string;
}> {
  const systemPrompt = getResponseAnalysisPrompt(stage, studentResponse);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: systemPrompt,
      },
    ],
  });

  const text = extractTextContent(response);
  
  // Remove markdown code blocks if present
  let cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  // Try to extract JSON if there's extra text
  const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanedText = jsonMatch[0];
  }
  
  try {
    return JSON.parse(cleanedText);
  } catch (e) {
    // Fallback if JSON parsing fails
    console.error('Failed to parse response analysis:', e);
    return {
      needsFollowUp: true,
      category: 'NEEDS_SPECIFICITY',
      reasoning: 'Could not parse response',
    };
  }
}

// ============================================================================
// Generate adaptive follow-up question
// ============================================================================

export async function generateFollowUp(
  stage: QuestionStage,
  studentResponse: string,
  issue: 'too_vague' | 'too_short' | 'too_abstract' | 'missed_question'
): Promise<string> {
  const systemPrompt = getFollowUpPrompt(stage, studentResponse, issue);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 200,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Generate a gentle follow-up question based on the student's response: "${studentResponse}". 
        
The question should be warm, encouraging, and help them provide more specific details. Keep it to 2-3 sentences. 
        
IMPORTANT: Generate ONLY the question text. Do NOT ask for more information or clarification. You already have the student's response - just generate the follow-up question directly.`,
      },
    ],
  });

  return extractTextContent(response);
}

// ============================================================================
// Generate essay outline from conversation
// ============================================================================

export async function generateOutline(
  conversation: ConversationState
): Promise<any> {
  const conversationHistory = formatConversationHistory(conversation);
  
  const systemPrompt = getOutlineGenerationPrompt(
    conversation.promptId,
    conversationHistory
  );

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4000, // Increased for more detailed, comprehensive outlines
    messages: [
      {
        role: 'user',
        content: systemPrompt,
      },
    ],
  });

  const text = extractTextContent(response);
  
  // Remove markdown code blocks if present
  let cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  // Try to extract JSON if there's extra text
  const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanedText = jsonMatch[0];
  }
  
  try {
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error('Failed to parse outline:', e);
    throw new Error('Failed to generate outline');
  }
}

// ============================================================================
// Generate refinement questions for specific section
// ============================================================================

export async function generateRefinementQuestions(
  sectionTitle: string,
  currentContent: string,
  conversationHistory: string
): Promise<string[]> {
  const systemPrompt = getSectionRefinementPrompt(
    sectionTitle,
    currentContent,
    conversationHistory
  );

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 400,
    messages: [
      {
        role: 'user',
        content: 'Generate the refinement questions.',
      },
    ],
  });

  const text = extractTextContent(response);
  
  // Parse numbered list into array
  return text
    .split('\n')
    .filter(line => /^\d+\./.test(line.trim()))
    .map(line => line.replace(/^\d+\.\s*/, '').trim());
}

// ============================================================================
// Helper functions
// ============================================================================

function formatConversationHistory(conversation: ConversationState): string {
  if (conversation.messages.length === 0) {
    return 'No conversation history yet.';
  }
  
  // Format messages with clear roles and include student responses from studentResponses
  const formattedMessages = conversation.messages
    .map(msg => {
      if (msg.role === 'assistant') {
        return `ASSISTANT: ${msg.content}`;
      } else {
        return `STUDENT: ${msg.content}`;
      }
    })
    .join('\n\n');
  
  // Also include student responses from studentResponses for context
  const studentResponses = Object.entries(conversation.studentResponses || {})
    .filter(([stage]) => stage !== 'FOLLOWUP' && stage !== 'COMPLETE')
    .map(([stage, response]) => `Student's response to ${stage}: ${response}`)
    .join('\n\n');
  
  if (studentResponses) {
    return `${formattedMessages}\n\n--- Additional Context ---\n${studentResponses}`;
  }
  
  return formattedMessages;
}

function extractTextContent(response: Anthropic.Messages.Message): string {
  const content = response.content[0];
  if (content.type === 'text') {
    return content.text;
  }
  throw new Error('Unexpected response type from Claude');
}

