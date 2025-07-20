import ButtonBar from '@/ui-components/button/group';
import DialogModal from './dialog';
import { BasicDialogModalData } from '../types';
import { Button } from '@/ui-components/button';

export default function BasicDialogModal({
  modal,
  isLoading,
}: {
  modal: BasicDialogModalData;
  isLoading?: boolean;
}) {
  return (
    <DialogModal
      type="dialog"
      title={modal.title}
      icon={modal.icon}
      body={modal.body}
      isLoading={isLoading}
      footer={
        <ButtonBar className="justify-end">
          <ButtonBar.Group>
            {modal.secondaryButton && (
              <Button
                theme={modal.theme}
                variant="tertiary"
                onClick={modal.secondaryButton.onClick}
              >
                {modal.secondaryButton.text}
              </Button>
            )}
            <Button theme={modal.theme} variant="primary" onClick={modal.primaryButton.onClick}>
              {modal.primaryButton.text}
            </Button>
          </ButtonBar.Group>
        </ButtonBar>
      }
    />
  );
}
