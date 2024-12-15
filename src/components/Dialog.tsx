import * as Dialog from '@radix-ui/react-dialog';

interface CustomDialogProps {
  title: string;
  description: string;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CustomDialog: React.FC<CustomDialogProps> = ({
  title,
  description,
  children,
  open,
  onOpenChange
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-[400px] max-h-[85vh] overflow-y-auto"
          aria-describedby={`dialog-description-${title.toLowerCase().replace(/\s+/g, '-')}`}
          aria-labelledby={`dialog-title-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title 
              className="text-lg font-semibold"
              id={`dialog-title-${title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {title}
            </Dialog.Title>
            <Dialog.Close className="text-gray-400 hover:text-gray-600">
              <span className="sr-only">Fermer</span>
              ×
            </Dialog.Close>
          </div>
          <Dialog.Description
            id={`dialog-description-${title.toLowerCase().replace(/\s+/g, '-')}`}
            className="text-sm text-gray-600 mb-4"
          >
            {description}
          </Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
