import { FC } from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  showLabel?: boolean;
}

export const ProgressBar: FC<ProgressBarProps> = ({ 
  current, 
  total, 
  showLabel = true 
}) => {
  const percentage = (current / total) * 100;
  
  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-2">
        {/* Dot indicators */}
        <div className="flex gap-1.5">
          {Array.from({ length: total }).map((_, idx) => (
            <div
              key={idx}
              className={`h-2 w-2 rounded-full transition-colors ${
                idx < current ? 'bg-[#222222]' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        
        {showLabel && (
          <span className="text-sm text-gray-600">
            Question {current} of {total}
          </span>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#222222] transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

