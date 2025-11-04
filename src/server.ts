import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { generateQuestion, analyzeResponse as analyzeResponseWithClaude, generateFollowUp, generateOutline } from './client/lib/claude';
import { QuestionStage } from './client/lib/types';
import { getPromptById } from './client/lib/prompts';

const app = express();
app.use(express.json());
app.use(cors()); // Enable CORS for frontend

app.get('/', (req, res) => {
  res.send('Server is running successfully');
});

// Brainstorming chat endpoint
app.post("/api/chat", async (req, res) => {
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
          questionStage: conversation.currentStage, // Include stage for client validation
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
      // Fallback
      analysis = {
        needsFollowUp: userResponse.trim().length < 20,
        category: 'NEEDS_EXPANSION',
        reasoning: 'Error analyzing response',
      };
    }

    // If response needs follow-up, generate adaptive question
    // BUT: Only allow 1 follow-up per session to prevent asking too many questions
    // Check if we've already done a follow-up for the current stage
    const hasAlreadyFollowedUp = Object.keys(conversation.studentResponses || {}).includes("FOLLOWUP");
    
    // Only allow follow-up if:
    // 1. Analysis says we need follow-up
    // 2. We haven't already done a follow-up in this session
    // 3. We're not already at FOLLOWUP (can't have nested follow-ups)
    // 4. We're not at COMPLETE
    // 5. We're not on Q1 (skip follow-ups for Q1 to avoid duplicate questions)
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

        console.log(`[Follow-up] Generating follow-up for stage: ${conversation.currentStage}, issue: ${issue}`);

        return res.json({
          nextStage: 'FOLLOWUP',
          needsFollowUp: true,
          followUpQuestion,
          progressPercentage: calculateProgress(conversation.currentStage),
        });
      } catch (error: any) {
        console.error('Error generating follow-up:', error);
        // Fallback
        // Fallback: store current stage
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
    // Simplified logic: track the last real stage (not FOLLOWUP) in conversation state
    let lastRealStage = conversation.currentStage;
    if (conversation.currentStage === "FOLLOWUP") {
      // Find the last non-FOLLOWUP stage from studentResponses
      const responseStages = Object.keys(conversation.studentResponses || {});
      const nonFollowupStages = responseStages.filter(stage => stage !== "FOLLOWUP" && stage !== "COMPLETE");
      
      if (nonFollowupStages.length > 0) {
        // Get the last non-FOLLOWUP stage (the one we were on before FOLLOWUP)
        lastRealStage = nonFollowupStages[nonFollowupStages.length - 1];
      } else {
        // Fallback: default to Q1 if we can't find it
        lastRealStage = "Q1_EXPLORATION";
      }
    }
    
    // Now move to the next stage after the last real stage
    const nextStage = getNextStageAfter(lastRealStage);

    const progressPercentage = calculateProgress(nextStage);

    return res.json({
      nextStage,
      needsFollowUp: false,
      progressPercentage,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return res.status(500).json({
      error: "Failed to process request",
      details: error?.message || String(error),
    });
  }
});

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

  // Move to next stage in progression
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
    FOLLOWUP: 50, // Approximate
    COMPLETE: 100,
  };
  return stageProgress[stage] || 0;
}

// Outline generation endpoint
app.post("/api/generate-outline", async (req, res) => {
  try {
    const { conversation } = req.body as {
      conversation?: any;
    };

    if (!conversation) {
      return res.status(400).json({ error: "Conversation state required" });
    }

    const prompt = getPromptById(conversation.promptId);
    if (!prompt) {
      return res.status(400).json({ error: "Invalid prompt ID" });
    }

    // Use Claude to generate outline with new system prompts
    try {
      const outline = await generateOutline(conversation);
      return res.json({
        sections: outline.sections || [],
        explanation: outline.explanation || '',
        followUpPrompt: outline.followUpPrompt || '',
        generatedAt: new Date().toISOString(),
        promptId: conversation.promptId,
      });
    } catch (error: any) {
      console.error("Outline generation error:", error);
      return res.status(500).json({
        error: "Failed to generate outline",
        details: error?.message || String(error),
      });
    }
  } catch (error: any) {
    console.error("Outline generation error:", error);
    return res.status(500).json({
      error: "Failed to generate outline",
      details: error?.message || String(error),
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
