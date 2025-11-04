import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface ArtifactsGalleryProps {
  onSelectArtifact: () => void;
}

export const ArtifactsGallery = ({ onSelectArtifact }: ArtifactsGalleryProps) => {
  const [activeTab, setActiveTab] = useState<'inspiration' | 'your-artifacts'>('inspiration');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Learn something', 'Life hacks', 'Play a game', 'Be creative', 'Touch grass'];

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
          <div className="flex items-center gap-6">
            <h1 className="text-3xl font-semibold text-[#1A1A1A]">Artifacts</h1>
            
            {/* Tabs */}
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('inspiration')}
                className={`pb-1 px-1 text-sm font-normal transition-colors ${
                  activeTab === 'inspiration'
                    ? 'text-[#1A1A1A] border-b-2 border-[#1A1A1A]'
                    : 'text-[#6B7280] hover:text-[#1A1A1A]'
                }`}
              >
                Inspiration
              </button>
              <button
                onClick={() => setActiveTab('your-artifacts')}
                className={`pb-1 px-1 text-sm font-normal transition-colors ${
                  activeTab === 'your-artifacts'
                    ? 'text-[#1A1A1A] border-b-2 border-[#1A1A1A]'
                    : 'text-[#6B7280] hover:text-[#1A1A1A]'
                }`}
              >
                Your artifacts
              </button>
            </div>
          </div>

          {/* New Artifact Button */}
          <Button
            className="bg-[#1A1A1A] hover:bg-[#333333] text-white rounded-lg flex items-center gap-2 px-4 py-2 text-sm font-normal"
            onClick={() => {
              // Placeholder for future feature: create new artifact
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New artifact
          </Button>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-full text-sm font-normal transition-colors ${
                selectedCategory === category
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-white text-[#6B7280] hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Artifacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Brainstorm College Essay Card */}
          <button
            onClick={onSelectArtifact}
            className="group text-left"
          >
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-3 shadow-sm hover:shadow-md transition-all">
              {/* Card Content - Essay Outline Preview */}
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-[#FF6B35]"></div>
                  <h4 className="text-sm font-semibold text-[#1A1A1A]">Essay Outline</h4>
                </div>
                
                {/* Outline Sections Preview */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-[#6B7280] mt-0.5">1.</span>
                    <div className="flex-1">
                      <div className="h-2 bg-gray-200 rounded w-full mb-1"></div>
                      <div className="h-1.5 bg-gray-100 rounded w-3/4"></div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-[#6B7280] mt-0.5">2.</span>
                    <div className="flex-1">
                      <div className="h-2 bg-gray-200 rounded w-full mb-1"></div>
                      <div className="h-1.5 bg-gray-100 rounded w-2/3"></div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-[#6B7280] mt-0.5">3.</span>
                    <div className="flex-1">
                      <div className="h-2 bg-gray-200 rounded w-full mb-1"></div>
                      <div className="h-1.5 bg-gray-100 rounded w-4/5"></div>
                    </div>
                  </div>
                </div>
                
                {/* Conversation Preview */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-[#FF6B35] flex items-center justify-center">
                      <span className="text-xs text-white font-semibold">C</span>
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-gray-200 rounded w-full mb-1"></div>
                      <div className="h-1.5 bg-gray-100 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="text-center text-sm font-normal text-[#1A1A1A] group-hover:text-[#333333] transition-colors mt-2">
              From Ideas to Outline for Your College Essay
            </h3>
          </button>
        </div>
      </div>
    </div>
  );
};

