import { Dialog } from '@headlessui/react';
import { CustomModalState, isTwoButtons } from '../../state/types/modal';
import Modal from './modal';
import { ModalProps } from './types';
import Button from '../../components/button';

export default function CustomResponseModal({
  payload,
  isOpen,
  closeModal,
}: ModalProps<CustomModalState>) {
  return (
    <Modal isOpen={isOpen} onClose={() => closeModal()}>
      <div>
        {payload.icon && (
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-fs-green-100">
            {payload.icon}
          </div>
        )}
        <div className="mt-3 text-center sm:mt-5">
          <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
            {payload.title}
          </Dialog.Title>
          {payload.content && (
            <div className="mt-2">
              <p className="text-sm text-gray-500">{payload.content}</p>
            </div>
          )}
        </div>
      </div>
      <>
        {payload.buttons && (
          <>
            {isTwoButtons(payload.buttons) ? (
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <Button
                  className="w-full inline-flex justify-center"
                  variant="secondary"
                  {...payload.buttons[1]}
                />
                <Button className="w-full inline-flex justify-center" {...payload.buttons[0]} />
              </div>
            ) : (
              <div className="mt-5 sm:m5-6">
                <Button className="w-full inline-flex justify-center" {...payload.buttons} />
              </div>
            )}
          </>
        )}
      </>
    </Modal>
  );
}
