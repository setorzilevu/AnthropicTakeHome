import { Button } from '@/components/ui/Button';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal = ({ isOpen, onClose }: HowItWorksModalProps) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white max-w-2xl w-full rounded-xl shadow-xl border border-gray-200 p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-6">
          How this works
        </h2>

        <div className="space-y-5 mb-6">
          <div className="flex gap-3">
            <span className="text-xl flex-shrink-0">✍️</span>
            <p className="text-base font-normal text-[#1A1A1A] leading-relaxed">
              You'll write short responses (2-4 sentences)
            </p>
          </div>

          <div className="flex gap-3">
            <span className="text-xl flex-shrink-0">💭</span>
            <p className="text-base font-normal text-[#1A1A1A] leading-relaxed">
              I'll ask follow-up questions to help you dig deeper
            </p>
          </div>

          <div className="flex gap-3">
            <span className="text-xl flex-shrink-0">📝</span>
            <p className="text-base font-normal text-[#1A1A1A] leading-relaxed">
              At the end, I'll create an outline using YOUR words and ideas
            </p>
          </div>
        </div>

        <p className="text-sm font-normal text-[#6B7280] mb-6 leading-relaxed">
          Remember: This is just brainstorming. You'll write the actual essay yourself later.
        </p>

        <Button
          onClick={onClose}
          className="w-full bg-[#1A1A1A] hover:bg-[#333333] text-white rounded-lg py-2.5 text-sm font-normal"
        >
          Got it
        </Button>
      </div>
    </div>
  );
};

