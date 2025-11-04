import { Button } from '@/components/ui/Button';
import { Outline } from '@/lib/types';

interface ExportOptionsProps {
  outline: Outline;
}

export const ExportOptions = ({ outline }: ExportOptionsProps) => {
  const handleExport = (format: 'text' | 'markdown') => {
    let content = '';
    
    if (format === 'text') {
      content = outline.sections
        .map(section => `${section.title}\n\n${section.content}\n\n`)
        .join('\n---\n\n');
    } else {
      content = outline.sections
        .map(section => `## ${section.title}\n\n${section.content}\n\n`)
        .join('\n---\n\n');
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `essay-outline.${format === 'markdown' ? 'md' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-3">
      <Button 
        variant="secondary" 
        onClick={() => handleExport('text')}
        className="text-sm font-normal"
      >
        Export as Text
      </Button>
      <Button 
        variant="secondary" 
        onClick={() => handleExport('markdown')}
        className="text-sm font-normal"
      >
        Export as Markdown
      </Button>
    </div>
  );
};

