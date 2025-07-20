import Modal from '@/modules/modal/ui/modal';
import { Dialog } from '@headlessui/react';
import { cn } from '@/utils';
import IconButton from '@/ui-components/button/icon';
import { ButtonTheme } from '@/ui-components/button';
import { DialogModalData } from '../types';
import FullScreenLoading from '@/ui-components/loading/full-screen-loading';
import { useSpecificModalContext } from '../context';
import Icon from '@/ui-components/icons/Icon';

const iconClass: Record<ButtonTheme, string> = {
  destructive: 'fill-status-red-400',
  primary: 'fill-neutral-400',
};

export default function DialogModal({
  isLoading,
  ...modal
}: DialogModalData & { isLoading?: boolean }) {
  const specificModal = useSpecificModalContext();

  return (
    <Modal size="md" wrapperClassName="px-12">
      {isLoading && <FullScreenLoading />}
      <div className="p-4 md:p-4 flex flex-col gap-y-4 pb-0 md:pb-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-x-2">
            {modal.icon && (
              <Icon
                {...modal.icon}
                size={'md'}
                className={cn(iconClass[modal.theme ?? 'primary'])}
              />
            )}
            <Dialog.Title as="h3" className={'heading-s'}>
              {modal.title}
            </Dialog.Title>
          </div>
          {modal.showCloseButton && (
            <IconButton
              theme={modal.theme}
              className="self-end"
              variant="quaternary"
              iconName="x"
              dataTestId="modal-close-button"
              onClick={() => specificModal.closeModal()}
            />
          )}
        </div>
        <div className="pl-0 text-type-primary">{modal.body}</div>
      </div>

      {modal.footer}
    </Modal>
  );
}
