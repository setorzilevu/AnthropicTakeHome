import { useState, useEffect, useCallback } from 'react';
import { TextArea } from '@/components/ui/TextArea';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingState } from './LoadingState';
import { useBrainstormSession } from '@/hooks/useBrainstormSession';
import { Outline } from '@/lib/types';

interface TwoPanelBrainstormProps {
  onComplete: (outline: Outline) => void;
}

export const TwoPanelBrainstorm = ({ onComplete }: TwoPanelBrainstormProps) => {
  const { 
    session, 
    currentQuestion, 
    submitResponse, 
    isLoading 
  } = useBrainstormSession();

  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [outlineProgress, setOutlineProgress] = useState<string>('');
  const [partialOutline, setPartialOutline] = useState<Outline | null>(null);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);

  // Calculate question number - use useEffect to ensure it updates when session changes
  const totalQuestions = 7;
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  
  useEffect(() => {
    if (session) {
      const questionNum = getQuestionNumber(session.conversation.currentStage, session);
      setCurrentQuestionNumber(questionNum);
    } else {
      setCurrentQuestionNumber(1);
    }
  }, [session?.conversation.currentStage, session]);

  // Check if we should complete after state updates
  useEffect(() => {
    if (session?.conversation.currentStage === 'COMPLETE') {
      generateFinalOutline();
    }
  }, [session?.conversation.currentStage]);

  const generatePartialOutline = useCallback(async () => {
    if (!session || isGeneratingOutline) return;

    setIsGeneratingOutline(true);
    setOutlineProgress('Analyzing your responses and updating outline...');
    
    try {
      // Make API call non-blocking - don't wait for it to complete before showing UI
      const responsePromise = fetch('/api/generate-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: session.conversation,
        }),
      });

      // Show optimistic update immediately
      setOutlineProgress('Processing your responses...');

      const response = await responsePromise;
      const data = await response.json();
      
      if (data.sections) {
        // Process sections to add id and canRefine fields
        interface SectionData {
          id?: string;
          title: string;
          content: string;
          canRefine?: boolean;
        }
        const processedSections = (data.sections || []).map((section: SectionData, idx: number) => ({
          ...section,
          id: section.id || `section-${idx}`,
          canRefine: section.canRefine !== undefined ? section.canRefine : true,
        }));
        setPartialOutline({
          sections: processedSections,
          explanation: data.explanation || '',
          followUpPrompt: data.followUpPrompt || '',
          generatedAt: new Date(),
          promptId: session.conversation.promptId,
        });
        setOutlineProgress('Outline updated based on your responses...');
        
        // Clear progress message after a delay
        setTimeout(() => {
          setOutlineProgress('');
        }, 2000);
      }
    } catch (error) {
      console.error('Error generating partial outline:', error);
      setOutlineProgress('Thinking about your story...');
    } finally {
      setIsGeneratingOutline(false);
    }
  }, [session, isGeneratingOutline]);

  // Generate outline progressively - only after every 2 questions to reduce API calls
  // Skip on initial load (when messages.length is 0 or 1)
  useEffect(() => {
    if (session && session.conversation.messages.length > 1) {
      const lastMessage = session.conversation.messages[session.conversation.messages.length - 1];
      // Only generate outline if the last message was from the user
      if (lastMessage.role === 'user') {
        // Count user responses to only generate outline after Q2, Q4, Q6 (every 2 questions)
        const userResponses = session.conversation.messages.filter(m => m.role === 'user').length;
        const shouldGenerateOutline = userResponses > 0 && (userResponses % 2 === 0 || userResponses >= 6);
        
        if (shouldGenerateOutline) {
          // Debounce with longer delay to avoid blocking
          const timer = setTimeout(() => {
            generatePartialOutline();
          }, 1000); // Increased debounce time
          return () => clearTimeout(timer);
        } else {
          // Show optimistic update for early questions
          setOutlineProgress('I am working on creating your outline. I\'ll update this screen periodically after every few questions as you provide more details.');
        }
      }
    }
  }, [session?.conversation.messages.length, session, generatePartialOutline]);

  const generateFinalOutline = async () => {
    setIsGeneratingOutline(true);
    setOutlineProgress('Generating your final outline...');
    
    if (!session) {
      setIsGeneratingOutline(false);
      return;
    }

    try {
      const response = await fetch('/api/generate-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: session.conversation,
        }),
      });

          const data = await response.json();
          if (data.sections) {
            // Process sections to add id and canRefine fields
            interface SectionData {
              id?: string;
              title: string;
              content: string;
              canRefine?: boolean;
            }
            const processedSections = (data.sections || []).map((section: SectionData, idx: number) => ({
              ...section,
              id: section.id || `section-${idx}`,
              canRefine: section.canRefine !== undefined ? section.canRefine : true,
            }));
            const finalOutline: Outline = {
              sections: processedSections,
              explanation: data.explanation || '',
              followUpPrompt: data.followUpPrompt || '',
              generatedAt: new Date(),
              promptId: session.conversation.promptId,
            };
        setPartialOutline(finalOutline);
        setOutlineProgress('Outline complete!');
        
        // Small delay before calling onComplete
        setTimeout(() => {
          onComplete(finalOutline);
        }, 500);
      }
    } catch (error) {
      console.error('Error generating final outline:', error);
      setOutlineProgress('Error generating outline. Please try again.');
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const handleNext = async () => {
    if (!response.trim()) {
      setError('Please write a response before continuing');
      return;
    }

    setError('');
    
    const isLastQuestion = session?.conversation.currentStage === 'Q7_FUTURE';
    
    // Clear response immediately for better UX
    const userResponse = response;
    setResponse('');
    
    // Show optimistic update immediately
    setOutlineProgress('Processing your response...');
    
    // Submit response (non-blocking for UI)
    submitResponse(userResponse).then((success) => {
      if (success) {
        if (isLastQuestion) {
          // Will be handled by useEffect watching for COMPLETE stage
          setTimeout(() => {
            generateFinalOutline();
          }, 500);
        }
      }
    }).catch((error) => {
      console.error('Error submitting response:', error);
      setError('Failed to submit response. Please try again.');
    });
  };

  // Early returns after all hooks
  if (!session) {
    return (
      <div className="flex h-screen bg-[#FDFCFB] items-center justify-center">
        <LoadingState message="Initializing brainstorming session..." />
      </div>
    );
  }

  // Don't block on question loading - show UI immediately
  const isQuestionLoading = isLoading && !currentQuestion;
  
  // Get loading message based on question number
  const getLoadingMessage = () => {
    if (currentQuestionNumber === 1) {
      return 'Preparing your first question...';
    } else if (currentQuestionNumber === totalQuestions) {
      return 'Preparing your last question...';
    } else {
      return 'Preparing your next question...';
    }
  };

  return (
    <div className="flex h-screen bg-[#FDFCFB] font-sans">
      {/* Left Panel - Question Input */}
      <div className="w-[40%] border-r border-gray-200 p-8 overflow-y-auto bg-white">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#6B7280] font-normal">
                Question {currentQuestionNumber} of {totalQuestions}
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#FF6B35] rounded-full transition-all duration-300"
                style={{ width: `${(currentQuestionNumber / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div>
            <div className="flex items-start gap-3 mb-6">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FF6B35] flex items-center justify-center text-white font-semibold text-sm">
                {currentQuestionNumber}
              </div>
              <div className="flex-1">
                {isQuestionLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
                    <p className="text-base font-normal text-[#1A1A1A] leading-relaxed">{getLoadingMessage()}</p>
                  </div>
                ) : (
                  <p className="text-base font-normal text-[#1A1A1A] leading-relaxed">
                    {currentQuestion || 'Loading question...'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Response Area */}
          <div>
            <TextArea
              label="Your response:"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="This could be academic, personal, social, or related to a passion..."
              helperText="2-4 sentences is plenty. Be honest."
              error={error}
              autoGrow
              className="min-h-[200px]"
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-end">
            <Button
              onClick={handleNext}
              disabled={!response.trim() || isLoading}
              isLoading={isLoading}
              className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white rounded-lg px-4 py-2.5 text-sm font-normal"
            >
              {(currentQuestionNumber >= totalQuestions || 
                session?.conversation.currentStage === 'Q7_FUTURE' ||
                session?.conversation.currentStage === 'COMPLETE')
                ? 'Generate Outline' 
                : 'Next Question'}
            </Button>
          </div>

          {/* Tip */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex gap-3">
              <span className="text-base">💡</span>
              <div>
                <p className="text-sm font-normal text-[#1A1A1A] mb-1">Tip:</p>
                <p className="text-sm font-normal text-[#6B7280] leading-relaxed">
                  Be specific! Instead of "I learned to be persistent," try "I learned that breaking big problems into small steps helps me stay motivated."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Outline Generation */}
      <div className="flex-1 p-8 overflow-y-auto bg-[#FDFCFB]">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
              High Level Outline for College Essay
            </h3>
            <p className="text-sm font-normal text-[#6B7280] leading-relaxed">
              This is a high-level outline of the structure you could consider for your essay. You'll receive a comprehensive breakdown after you answer all the questions.
            </p>
          </div>

          {/* Chat-like interface showing outline generation */}
          <div className="space-y-4 mb-8">
            {/* Claude's thinking/status messages */}
            {outlineProgress && (
              <div className="flex gap-3 mb-4">
                <div className="w-7 h-7 rounded-full bg-[#FF6B35] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  C
                </div>
                <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 flex-1">
                  <p className="text-sm font-normal text-[#1A1A1A] leading-relaxed">{outlineProgress}</p>
                </div>
              </div>
            )}

            {/* Partial outline sections */}
            {partialOutline && partialOutline.sections.length > 0 && (
              <div className="space-y-3">
                {partialOutline.sections.map((section, idx) => (
                  <div key={section.id || idx} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <h4 className="text-sm font-semibold text-[#1A1A1A]">{section.title}</h4>
                    </div>
                    <p className="text-sm font-normal text-[#6B7280] leading-relaxed">
                      {section.content.length > 200 
                        ? `${section.content.substring(0, 200)}...` 
                        : section.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Loading state for outline generation */}
            {isGeneratingOutline && !partialOutline && (
              <div className="flex gap-3 mb-4">
                <div className="w-7 h-7 rounded-full bg-[#FF6B35] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  C
                </div>
                <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-normal text-[#1A1A1A]">Analyzing your responses and generating outline...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Initial state */}
            {!outlineProgress && !partialOutline && !isGeneratingOutline && (
              <div className="flex gap-3 mb-4">
                <div className="w-7 h-7 rounded-full bg-[#FF6B35] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  C
                </div>
                <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 flex-1">
                  <p className="text-sm font-normal text-[#1A1A1A] leading-relaxed">
                    As you answer each question, I'll analyze your responses and generate a comprehensive outline for your essay. The outline will update after each question, building a detailed structure based on your authentic story and experiences.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper to convert stage to question number
const getQuestionNumber = (stage: string, session?: { conversation?: { currentStage?: string; studentResponses?: Record<string, string> } }): number => {
  if (stage === 'FOLLOWUP' && session) {
    const responseStages = Object.keys(session.conversation?.studentResponses || {});
    const nonFollowupStages = responseStages.filter(s => s !== 'FOLLOWUP' && s !== 'COMPLETE');
    if (nonFollowupStages.length > 0) {
      const lastRealStage = nonFollowupStages[nonFollowupStages.length - 1];
      return getQuestionNumberForStage(lastRealStage);
    }
    return 1;
  }
  return getQuestionNumberForStage(stage);
};

const getQuestionNumberForStage = (stage: string): number => {
  const stageMap: Record<string, number> = {
    'Q1_EXPLORATION': 1,
    'Q2_SELECTION': 2,
    'Q3_SPECIFIC_MOMENT': 3,
    'Q4_DILEMMA': 4,
    'Q5_ACTION': 5,
    'Q6_DISCOVERY': 6,
    'Q7_FUTURE': 7,
    'COMPLETE': 7,
  };
  return stageMap[stage] || 1;
};

