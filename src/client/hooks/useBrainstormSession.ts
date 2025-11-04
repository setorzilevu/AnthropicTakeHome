import { useState, useEffect } from 'react';
import { BrainstormSession, ConversationState, Message, QuestionStage, PromptId } from '../lib/types';
import { useLocalStorage } from './useLocalStorage';

export const useBrainstormSession = () => {
  const [session, setSession] = useLocalStorage<BrainstormSession | null>('brainstorm-session', null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');

  // Initialize session if it doesn't exist
  useEffect(() => {
    const selectedPrompt = localStorage.getItem('selectedPrompt');
    
    if (!session && selectedPrompt) {
      const newSession: BrainstormSession = {
        id: crypto.randomUUID(),
        conversation: {
          promptId: selectedPrompt as PromptId,
          currentStage: 'Q1_EXPLORATION',
          messages: [],
          studentResponses: {},
          needsFollowUp: false,
          progressPercentage: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setSession(newSession);
    }
  }, [session, setSession]);

  // Fetch current question from Claude
  // Only fetch if we don't already have a question for this stage
  useEffect(() => {
    if (!session || session.conversation.currentStage === 'COMPLETE' || isLoading) {
      return;
    }

    // Check if we already have a question for this stage in messages
    const assistantMessageForStage = session.conversation.messages.find(
      (msg: Message) => msg.role === 'assistant' && msg.questionStage === session.conversation.currentStage
    );
    
    // If we have a message for this stage, use it instead of fetching
    if (assistantMessageForStage) {
      setCurrentQuestion(assistantMessageForStage.content);
      return;
    }
    
    // Always fetch if we don't have a question for this stage yet
    // This ensures we get the new question when stage changes
    // Use setTimeout to make it non-blocking and show UI immediately
    if (!assistantMessageForStage) {
      // Show loading state immediately
      setCurrentQuestion(''); // Clear previous question to show loading
      // Use setTimeout to avoid blocking the initial render
      const timer = setTimeout(() => {
        fetchCurrentQuestion();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [session?.conversation.currentStage]);

  const fetchCurrentQuestion = async () => {
    if (!session || isLoading) return; // Prevent concurrent fetches

    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: session.conversation,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Only update if we still have a session and the stage matches (or if no stage is provided)
      if (session && (!data.questionStage || session.conversation.currentStage === data.questionStage)) {
        const question = data.question || '';
        setCurrentQuestion(question);
        
        // Also add the question as an assistant message so we don't need to refetch it
        if (question && session) {
          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: question,
            timestamp: new Date(),
            questionStage: session.conversation.currentStage,
          };
          
          // Make sure to only add the assistant message if it does not already exist for this stage and content
          const hasMessage = !!session.conversation.messages.find(
            (msg: Message) =>
              msg.role === 'assistant' &&
              msg.questionStage === session.conversation.currentStage &&
              msg.content.trim() === question.trim()
          );
          if (!hasMessage) {
            const updatedSession: BrainstormSession = {
              ...session,
              conversation: {
                ...session.conversation,
                messages: [...session.conversation.messages, assistantMessage],
              },
              updatedAt: new Date(),
            };
            setSession(updatedSession);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching question:', error);
      setCurrentQuestion('Sorry, something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitResponse = async (response: string): Promise<boolean> => {
    if (!session) return false;

    setIsLoading(true);
    try {
      // Add user message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: response,
        timestamp: new Date(),
        questionStage: session.conversation.currentStage,
      };

      // Send to API to determine next stage
      const apiResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: session.conversation,
          userResponse: response,
        }),
      });

      const data = await apiResponse.json();
      

      // If there's a follow-up question, add it as an assistant message
      if (data.needsFollowUp && data.followUpQuestion) {
        const followUpMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.followUpQuestion,
          timestamp: new Date(),
          questionStage: 'FOLLOWUP',
        };
        
        // Update session with follow-up question
        const updatedSession: BrainstormSession = {
          ...session,
          conversation: {
            ...session.conversation,
            messages: [...session.conversation.messages, userMessage, followUpMessage],
            studentResponses: {
              ...session.conversation.studentResponses,
              [session.conversation.currentStage]: response,
            },
            currentStage: 'FOLLOWUP',
            needsFollowUp: true,
            progressPercentage: data.progressPercentage || session.conversation.progressPercentage,
          },
          updatedAt: new Date(),
        };
        
        setSession(updatedSession);
        // Update current question for display immediately - no need to fetch
        setCurrentQuestion(data.followUpQuestion);
      } else {
        // Update session normally
        const nextStage = data.nextStage || session.conversation.currentStage;
        
        const updatedSession: BrainstormSession = {
          ...session,
          conversation: {
            ...session.conversation,
            messages: [...session.conversation.messages, userMessage],
            studentResponses: {
              ...session.conversation.studentResponses,
              [session.conversation.currentStage]: response,
            },
            currentStage: nextStage,
            needsFollowUp: false,
            progressPercentage: data.progressPercentage || session.conversation.progressPercentage,
          },
          updatedAt: new Date(),
        };

        setSession(updatedSession);
        
        // Clear current question - it will be fetched by the useEffect
        // But only if we're not already at COMPLETE
        if (nextStage !== 'COMPLETE') {
          setCurrentQuestion('');
        }
        
        // If we just completed Q7, return true and let the component handle completion
        if (nextStage === 'COMPLETE') {
          return true;
        }
      }
      return true;
    } catch (error) {
      console.error('Error submitting response:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (!session) return;

    // Simple back logic - go to previous stage
    const stages: QuestionStage[] = [
      'Q1_EXPLORATION',
      'Q2_SELECTION',
      'Q3_SPECIFIC_MOMENT',
      'Q4_DILEMMA',
      'Q5_ACTION',
      'Q6_DISCOVERY',
      'Q7_FUTURE',
    ];

    const currentIndex = stages.indexOf(session.conversation.currentStage);
    if (currentIndex > 0) {
      const updatedSession = {
        ...session,
        conversation: {
          ...session.conversation,
          currentStage: stages[currentIndex - 1],
        },
      };
      setSession(updatedSession);
    }
  };

  return {
    session,
    currentQuestion,
    submitResponse,
    goBack,
    isLoading,
  };
};

