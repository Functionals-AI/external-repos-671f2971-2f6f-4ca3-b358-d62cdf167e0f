import { Dialog } from '@headlessui/react';
import { ErrorState } from '../../state/types/modal';
import { ErrorIcon } from './icons';
import Modal from './modal';
import { ModalProps } from './types';
import { useTranslation } from 'react-i18next';
import { ReportIssueButton } from '@/smart-components/report-issue-button'

export default function ErrorModal({ payload, isOpen, closeModal }: ModalProps<ErrorState>) {
  const { t } = useTranslation();
  const { title, subtitle, code, trace } = payload;

  return (
    <Modal {...{ onClose: () => closeModal(), isOpen, modalClassName: 'max-w-xl' }}>
      <div>
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-fs-green-100">
          <ErrorIcon />
        </div>
        <div className="mt-3 text-center sm:mt-5">
          <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-4">
            <p className="text-sm text-gray-500">{subtitle}</p>
            {code && <p className="text-sm text-gray-500">{code}</p>}
            {trace && <p className="text-sm text-gray-500">Trace ID: {trace}</p>}
          </Dialog.Description>
        </div>
      </div>
      <div className="mt-5 sm:mt-6">

        <ReportIssueButton error={{ trace, message: [title, subtitle].join('\n') }} />
        <button
          type="button"
          className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-f-light-green text-base font-medium text-white hover:bg-f-dark-green focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-f-light-green sm:text-sm"
          onClick={() => closeModal()}
        >
          {t('Close', 'Close')}
        </button>
      </div>
    </Modal>
  );
}
