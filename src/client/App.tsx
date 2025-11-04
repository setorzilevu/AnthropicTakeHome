import { useState, useEffect } from 'react';
import { ArtifactsGallery } from './components/landing/ArtifactsGallery';
import { HowItWorksModal } from './components/prompts/HowItWorksModal';
import { TwoPanelBrainstorm } from './components/brainstorm/TwoPanelBrainstorm';
import { COMMON_APP_PROMPTS } from './lib/prompts';
import { PromptId, Outline } from './lib/types';
import { OutlineSection } from './components/outline/OutlineSection';
import { RefineModal } from './components/outline/RefineModal';
import { ExportOptions } from './components/outline/ExportOptions';
import { Button } from './components/ui/Button';

type Page = 'landing' | 'prompts' | 'brainstorm' | 'outline';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [selectedPrompt, setSelectedPrompt] = useState<PromptId | null>(null);
  const [outline, setOutline] = useState<Outline | null>(null);
  const [refiningSectionId, setRefiningSectionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Show "How it works" modal when prompts page loads
  useEffect(() => {
    if (currentPage === 'prompts') {
      setShowHowItWorks(true);
    } else {
      setShowHowItWorks(false);
    }
  }, [currentPage]);

  // Error boundary - catch any errors
  if (error) {
    return (
      <main className="min-h-screen bg-[#F8F8F8] py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button 
            onClick={() => {
              setError(null);
              setCurrentPage('landing');
            }}
            className="bg-[#222222] hover:bg-[#333333] text-white rounded-lg"
          >
            Go Back Home
          </Button>
        </div>
      </main>
    );
  }

  // Landing page
  if (currentPage === 'landing') {
    return (
      <ArtifactsGallery onSelectArtifact={() => setCurrentPage('prompts')} />
    );
  }

  // Prompts selection page
  if (currentPage === 'prompts') {
    const handlePromptSelect = (promptId: PromptId) => {
      try {
        localStorage.setItem('selectedPrompt', promptId);
        setSelectedPrompt(promptId);
        setCurrentPage('brainstorm');
      } catch (err: any) {
        console.error('Error selecting prompt:', err);
        setError(err.message || 'Failed to select prompt');
      }
    };

    const handleCloseHowItWorks = () => {
      setShowHowItWorks(false);
    };

    // Safety check for prompts
    if (!COMMON_APP_PROMPTS || COMMON_APP_PROMPTS.length === 0) {
      return (
        <main className="min-h-screen bg-white py-12">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Loading prompts...
              </h1>
              <p className="text-gray-600">
                Please wait while we load the prompts.
              </p>
            </div>
          </div>
        </main>
      );
    }

    return (
      <main className="min-h-screen bg-[#FDFCFB] py-8 font-sans">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header with Title and Button */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-semibold text-[#1A1A1A]">
              Prompts
            </h1>
            <Button
              className="bg-[#1A1A1A] hover:bg-[#333333] text-white rounded-lg flex items-center gap-2 px-4 py-2 text-sm font-normal"
              onClick={() => {
                // Placeholder for future feature: create custom prompt
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New prompt
            </Button>
          </div>

          {/* Introduction Text */}
          <div className="mb-8">
            <p className="text-base font-normal text-[#6B7280] leading-relaxed max-w-3xl">
              Let's discover your story together. I'm here to help you brainstorm your college essay through guided reflection. Choose a Common App essay prompt below to begin your brainstorming session. I'll guide you through thoughtful questions to help you uncover your authentic narrative.
            </p>
          </div>

          {/* Prompts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {COMMON_APP_PROMPTS.map((prompt) => {
              if (!prompt || !prompt.id) {
                console.warn('Invalid prompt:', prompt);
                return null;
              }
              
              return (
                <button
                  key={prompt.id}
                  onClick={() => handlePromptSelect(prompt.id)}
                  className="bg-white rounded-xl p-6 text-left hover:shadow-sm transition-all border border-gray-100 hover:border-gray-200 relative group"
                >
                  {/* Ellipsis menu (top right) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Placeholder for future feature: prompt context menu
                    }}
                    className="absolute top-4 right-4 p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Prompt options"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>

                  {/* Title and Tag */}
                  <div className="flex items-start justify-between gap-3 mb-3 pr-8">
                    <h3 className="text-lg font-semibold text-[#1A1A1A] flex-1">
                      {prompt.title}
                    </h3>
                    <span className="px-3 py-1 rounded-full text-xs font-normal flex-shrink-0 bg-gray-100 text-[#6B7280]">
                      {prompt.id === 'identity' ? 'Identity' : 
                       prompt.id === 'challenge' ? 'Challenge' :
                       prompt.id === 'belief' ? 'Belief' : 'Open Topic'}
                    </span>
                  </div>
                  
                  {/* Description */}
                  <p className="text-sm font-normal text-[#1A1A1A] leading-relaxed mb-4">
                    {prompt.fullText}
                  </p>
                  
                  {/* Best for hint */}
                  <p className="text-sm font-normal text-[#6B7280]">
                    Best for: {prompt.bestFor}
                  </p>
                </button>
              );
            })}
          </div>

          {/* How It Works Modal */}
          <HowItWorksModal 
            isOpen={showHowItWorks} 
            onClose={handleCloseHowItWorks} 
          />
        </div>
      </main>
    );
  }

  // Brainstorm page
  if (currentPage === 'brainstorm') {
    const handleComplete = (completedOutline: Outline) => {
      setOutline(completedOutline);
      setCurrentPage('outline');
    };

    return (
      <TwoPanelBrainstorm onComplete={handleComplete} />
    );
  }

  // Outline page
  if (currentPage === 'outline' && outline) {
    const handleRefine = async (sectionId: string, refinedContent: string) => {
      setOutline({
        ...outline,
        sections: outline.sections.map(section =>
          section.id === sectionId
            ? { ...section, content: refinedContent }
            : section
        ),
      });
      setRefiningSectionId(null);
    };

    const refiningSection = outline.sections.find(
      s => s.id === refiningSectionId
    );

    return (
      <main className="min-h-screen bg-[#FDFCFB] py-8 font-sans">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-[#1A1A1A] mb-2">
              Your Essay Outline
            </h1>
            <p className="text-base font-normal text-[#6B7280] mb-6">
              Here's your detailed outline based on our conversation. You can refine any section, 
              or export it to start writing your essay.
            </p>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <ExportOptions outline={outline} />
            </div>
          </div>

          {/* Two Panel Layout */}
          <div className="flex gap-6">
            {/* Left Panel - Outline Structure */}
            <div className="w-1/2">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">
                  Outline Structure
                </h2>
                <p className="text-sm font-normal text-[#6B7280] leading-relaxed mb-4">
                  This is a high-level overview of your essay structure. Each section builds on the previous one to create a compelling narrative.
                </p>
              </div>

              {/* Outline Sections */}
              <div className="space-y-3">
                {outline.sections.map((section) => (
                  <OutlineSection
                    key={section.id}
                    section={section}
                    onRefine={() => setRefiningSectionId(section.id)}
                  />
                ))}
              </div>
            </div>

            {/* Right Panel - Explanation & Suggestions */}
            <div className="w-1/2">
              {/* Explanation Section */}
              {outline.explanation && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                  <h2 className="text-lg font-semibold text-[#1A1A1A] mb-3">
                    Why This Structure Works for Your Story
                  </h2>
                  <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm font-normal text-[#1A1A1A] leading-relaxed">
                      <strong className="font-semibold">Important:</strong> This is just a <strong className="font-semibold">skeleton outline</strong> and not meant to be the essay itself. <strong className="font-semibold">You are responsible for writing the essay</strong>, but I'm happy to assist you along the way.
                    </p>
                  </div>
                  <p className="text-sm font-normal text-[#1A1A1A] whitespace-pre-line leading-relaxed">
                    {outline.explanation}
                  </p>
                </div>
              )}

              {/* Suggestions Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">
                  How to Craft Your Story
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[#1A1A1A] mb-2">
                      Building Your Narrative
                    </h3>
                    <p className="text-sm font-normal text-[#6B7280] leading-relaxed">
                      Use the outline as a roadmap. Each section should flow naturally into the next, creating a cohesive story that reveals your growth and perspective.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#1A1A1A] mb-2">
                      The Impact You'll Create
                    </h3>
                    <p className="text-sm font-normal text-[#6B7280] leading-relaxed">
                      A well-structured essay that follows this outline will help admissions officers understand your unique journey, values, and potential. The progression from challenge to insight to growth demonstrates maturity and self-awareness.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#1A1A1A] mb-2">
                      Working Together
                    </h3>
                    <p className="text-sm font-normal text-[#6B7280] leading-relaxed">
                      As you write, I can help you refine specific sections, develop your ideas further, or provide feedback on your draft. The outline is our starting point—your authentic voice and experiences will bring it to life.
                    </p>
                  </div>
                </div>
              </div>

              {/* Follow-up Prompt */}
              {outline.followUpPrompt && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
                  <h2 className="text-lg font-semibold text-[#1A1A1A] mb-3">
                    Next Steps
                  </h2>
                  <p className="text-sm font-normal text-[#1A1A1A] whitespace-pre-line leading-relaxed mb-4">
                    {outline.followUpPrompt}
                  </p>
                  <Button
                    onClick={() => {
                      // Future feature: essay submission flow
                      alert('Essay submission feature coming soon! For now, you can export your outline and start writing.');
                    }}
                    className="bg-[#1A1A1A] hover:bg-[#333333] text-white rounded-lg px-4 py-2 text-sm font-normal"
                  >
                    Submit Essay for Review
                  </Button>
                </div>
              )}
            </div>
          </div>

          {refiningSection && (
            <RefineModal
              isOpen={refiningSectionId !== null}
              onClose={() => setRefiningSectionId(null)}
              sectionTitle={refiningSection.title}
              currentContent={refiningSection.content}
              onRefine={(refinedContent) => handleRefine(refiningSection.id, refinedContent)}
            />
          )}
        </div>
      </main>
    );
  }

  // Fallback - should never reach here, but just in case
  return (
    <main className="min-h-screen bg-[#F8F8F8] py-12">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-6">
          The page you're looking for doesn't exist or there was an error.
        </p>
        <Button 
          onClick={() => setCurrentPage('landing')}
          className="bg-[#222222] hover:bg-[#333333] text-white rounded-lg"
        >
          Go Back Home
        </Button>
      </div>
    </main>
  );
}
