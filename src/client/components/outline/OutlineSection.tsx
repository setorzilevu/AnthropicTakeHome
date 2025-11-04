import { OutlineSection as OutlineSectionType } from '@/lib/types';
import { Card } from '@/components/ui/Card';

interface OutlineSectionProps {
  section: OutlineSectionType;
  onRefine?: (sectionId: string) => void;
}

export const OutlineSection = ({ section, onRefine }: OutlineSectionProps) => {
  return (
    <div className="mb-4 bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-[#1A1A1A] mb-2">
            {section.title}
          </h3>
          
          <div className="text-sm font-normal text-[#1A1A1A] whitespace-pre-line leading-relaxed">
            {section.content}
          </div>
          
          {section.canRefine && onRefine && (
            <button
              onClick={() => onRefine(section.id)}
              className="mt-3 text-sm font-normal text-[#6B7280] hover:text-[#1A1A1A] transition-colors"
            >
              Refine this section
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

