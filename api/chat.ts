import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateQuestion, analyzeResponse as analyzeResponseWithClaude, generateFollowUp } from '../src/client/lib/claude';
import { QuestionStage } from '../src/client/lib/types';
import { getPromptById } from '../src/client/lib/prompts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { conversation, userResponse } = req.body as {
      conversation?: any;
      userResponse?: string;
    };

    if (!conversation) {
      return res.status(400).json({ error: "Conversation state required" });
    }

    const prompt = getPromptById(conversation.promptId);
    if (!prompt) {
      return res.status(400).json({ error: "Invalid prompt ID" });
    }

    // If no user response, just return current question using Claude
    if (!userResponse) {
      try {
        const question = await generateQuestion(conversation);
        return res.json({ 
          question,
          questionStage: conversation.currentStage,
        });
      } catch (error: any) {
        console.error('Error generating question:', error);
        // Fallback to simple question
        const question = getNextQuestion(conversation);
        return res.json({ 
          question,
          questionStage: conversation.currentStage,
        });
      }
    }

    // Analyze user response using Claude
    let analysis: { needsFollowUp: boolean; category: string; reasoning: string };
    try {
      analysis = await analyzeResponseWithClaude(
        conversation.currentStage as QuestionStage,
        userResponse
      );
    } catch (error: any) {
      console.error('Error analyzing response:', error);
      analysis = {
        needsFollowUp: userResponse.trim().length < 20,
        category: 'NEEDS_EXPANSION',
        reasoning: 'Error analyzing response',
      };
    }

    // Check if we can have follow-up
    const hasAlreadyFollowedUp = Object.keys(conversation.studentResponses || {}).includes("FOLLOWUP");
    
    const canHaveFollowup = analysis.needsFollowUp && 
                            !hasAlreadyFollowedUp && 
                            conversation.currentStage !== "FOLLOWUP" &&
                            conversation.currentStage !== "COMPLETE" &&
                            conversation.currentStage !== "Q1_EXPLORATION";
    
    if (canHaveFollowup) {
      try {
        const issueMap: Record<string, 'too_vague' | 'too_short' | 'too_abstract' | 'missed_question'> = {
          NEEDS_SPECIFICITY: 'too_vague',
          NEEDS_DEPTH: 'too_abstract',
          NEEDS_EXPANSION: 'too_short',
          OFF_TRACK: 'missed_question',
        };

        const issue = issueMap[analysis.category] || 'too_vague';
        const followUpQuestion = await generateFollowUp(
          conversation.currentStage as QuestionStage,
          userResponse,
          issue
        );

        return res.json({
          nextStage: 'FOLLOWUP',
          needsFollowUp: true,
          followUpQuestion,
          progressPercentage: calculateProgress(conversation.currentStage),
        });
      } catch (error: any) {
        console.error('Error generating follow-up:', error);
        const stageBeforeFollowup = conversation.currentStage;
        
        return res.json({
          nextStage: 'FOLLOWUP',
          needsFollowUp: true,
          followUpQuestion: "Can you tell me more about that? I'd love to hear more specific details.",
          progressPercentage: calculateProgress(conversation.currentStage),
          stageBeforeFollowup,
        });
      }
    }

    // Response is good - move to next stage
    let lastRealStage = conversation.currentStage;
    if (conversation.currentStage === "FOLLOWUP") {
      const responseStages = Object.keys(conversation.studentResponses || {});
      const nonFollowupStages = responseStages.filter(stage => stage !== "FOLLOWUP" && stage !== "COMPLETE");
      
      if (nonFollowupStages.length > 0) {
        lastRealStage = nonFollowupStages[nonFollowupStages.length - 1];
      } else {
        lastRealStage = "Q1_EXPLORATION";
      }
    }
    
    const nextStage = getNextStageAfter(lastRealStage);
    const progressPercentage = calculateProgress(nextStage);

    return res.json({
      nextStage,
      needsFollowUp: false,
      progressPercentage,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    console.error("Error stack:", error?.stack);
    console.error("Error message:", error?.message);
    return res.status(500).json({
      error: "Failed to process request",
      details: error?.message || String(error),
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    });
  }
}

// Helper function to get next question based on stage (fallback)
function getNextQuestion(conversation: any): string {
  const stage = conversation.currentStage;
  const prompt = getPromptById(conversation.promptId);
  
  const questionMap: Record<string, string> = {
    Q1_EXPLORATION: `Let's start with the prompt: "${prompt?.fullText || 'your chosen prompt'}"\n\nThink about this prompt for a moment. What comes to mind? What experiences, moments, or stories feel most meaningful to you right now?`,
    Q2_SELECTION: `Great start. Now, from what you've shared, which specific experience or moment feels most important to you? Why does this one stand out?`,
    Q3_SPECIFIC_MOMENT: `Let's zoom in. Can you describe a specific moment within that experience? What did you see, hear, or feel? What was happening around you?`,
    Q4_DILEMMA: `What was the challenge or dilemma you faced in that moment? What made it difficult? What were you struggling with?`,
    Q5_ACTION: `What did you do? What action did you take, or what choice did you make? How did you respond?`,
    Q6_DISCOVERY: `What did you learn from this experience? What did you discover about yourself, others, or the world?`,
    Q7_FUTURE: `How has this experience shaped who you are today? What does it mean for your future?`,
    FOLLOWUP: `Can you tell me more about that? I'd love to hear more specific details.`,
  };

  return questionMap[stage] || questionMap.Q1_EXPLORATION;
}

// Helper function to get the next stage after a given stage
function getNextStageAfter(stage: string): string {
  const stageProgression = [
    "Q1_EXPLORATION",
    "Q2_SELECTION",
    "Q3_SPECIFIC_MOMENT",
    "Q4_DILEMMA",
    "Q5_ACTION",
    "Q6_DISCOVERY",
    "Q7_FUTURE",
    "COMPLETE",
  ];

  const currentIndex = stageProgression.indexOf(stage);
  
  if (currentIndex === -1) {
    return "Q2_SELECTION";
  }

  if (currentIndex < stageProgression.length - 1) {
    return stageProgression[currentIndex + 1];
  }

  return "COMPLETE";
}

// Helper function to calculate progress
function calculateProgress(stage: string): number {
  const stageProgress: Record<string, number> = {
    Q1_EXPLORATION: 14,
    Q2_SELECTION: 28,
    Q3_SPECIFIC_MOMENT: 42,
    Q4_DILEMMA: 56,
    Q5_ACTION: 70,
    Q6_DISCOVERY: 85,
    Q7_FUTURE: 100,
    FOLLOWUP: 50,
    COMPLETE: 100,
  };
  return stageProgress[stage] || 0;
}

