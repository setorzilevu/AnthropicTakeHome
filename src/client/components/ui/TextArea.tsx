import { FC, TextareaHTMLAttributes, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  autoGrow?: boolean;
}

export const TextArea: FC<TextAreaProps> = ({
  label,
  helperText,
  error,
  autoGrow = true,
  className,
  ...props
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow functionality
  useEffect(() => {
    if (autoGrow && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [props.value, autoGrow]);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-normal text-[#6B7280] mb-2">
          {label}
        </label>
      )}
      
      <textarea
        ref={textareaRef}
        className={cn(
          'w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-[#1A1A1A]',
          'focus:ring-1 focus:ring-[#FF6B35] focus:border-[#FF6B35]',
          'resize-none transition-all text-sm font-normal',
          'placeholder:text-[#6B7280]',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        rows={4}
        {...props}
      />
      
      {helperText && !error && (
        <p className="mt-2 text-sm font-normal text-[#6B7280]">
          {helperText}
        </p>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

