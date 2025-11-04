import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateOutline } from '../src/client/lib/claude';
import { getPromptById } from '../src/client/lib/prompts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
}

