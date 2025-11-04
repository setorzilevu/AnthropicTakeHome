import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { TextArea } from '@/components/ui/TextArea';
import { Button } from '@/components/ui/Button';

interface RefineModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionTitle: string;
  currentContent: string;
  onRefine: (refinedContent: string) => void;
}

export const RefineModal = ({
  isOpen,
  onClose,
  sectionTitle,
  currentContent,
  onRefine,
}: RefineModalProps) => {
  const [refinedContent, setRefinedContent] = useState(currentContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update content when modal opens or currentContent changes
  useEffect(() => {
    if (isOpen) {
      setRefinedContent(currentContent);
    }
  }, [isOpen, currentContent]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    onRefine(refinedContent);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Refine: ${sectionTitle}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Save Changes
          </Button>
        </>
      }
    >
      <TextArea
        value={refinedContent}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRefinedContent(e.target.value)}
        autoGrow
        rows={10}
      />
    </Modal>
  );
};

