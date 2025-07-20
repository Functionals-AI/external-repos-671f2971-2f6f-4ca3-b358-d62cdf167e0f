import { useState } from 'react';
import Button from '../../../components/button';
import HeaderSubheader from '../../../components/header-subheader';
import WizardSteps from '../../../components/wizard/wizard-steps';
import { AppointmentCancellationModalState } from '../../../state/types/modal';
import Modal from '../modal';
import Wizard from '../../../components/wizard';
import { ModalProps } from '../types';
import { useTranslation } from 'react-i18next';
import ChooseReason from './choose-reason';
import { CheckCircleIcon } from '@heroicons/react/solid';
import { ErrorIcon } from '../icons';
import { Dialog } from '@headlessui/react';

export default function AppointmentCancellationModal({
  isOpen,
  closeModal,
  payload,
}: ModalProps<AppointmentCancellationModalState>) {
  const { t } = useTranslation();
  const [err, setErr] = useState<any>(null);
  return (
    <Modal {...{ isOpen, onClose: closeModal, modalClassName: 'w-full max-w-2xl' }}>
      <div>
        <Wizard
          flowName="appointment-cancellation"
          ignorePostEvent={true}
          steps={{
            'choose-reason': {
              render: ({ goTo }) => (
                <>
                  <HeaderSubheader header={t('CancelAppointment', 'Cancel Appointment')} />
                  <ChooseReason
                    forcedCancelReason={payload.forcedCancelReason}
                    appointmentId={payload.appointmentId}
                    onSuccess={() => goTo('success')}
                    onCancel={() => closeModal()}
                    onFail={(err) => {
                      setErr(err);
                      goTo('fail', err);
                    }}
                  />
                </>
              ),
            },
            success: {
              render: () => (
                <div>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-fs-green-100">
                    <CheckCircleIcon className="h-50 w-50" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        <div className="flex flex-col gap-y-4">
                          <p>
                            {t(
                              'WeHaveNotifiedPatientAppointmentCanceled',
                              'We have notified the patient that this appointment has been canceled.',
                            )}
                          </p>
                          <Button
                            onClick={() => {
                              payload.onClose?.();
                              closeModal();
                            }}
                          >
                            {t('BackToDashboard', 'Back To Dashboard')}
                          </Button>
                        </div>
                      </p>
                    </div>
                  </div>
                </div>
              ),
            },
            fail: {
              render: () => (
                <>
                  <div>
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-fs-green-100">
                      <ErrorIcon />
                    </div>
                    <div className="mt-3 text-center sm:mt-5">
                      <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
                        {t('Error')}
                      </Dialog.Title>
                      <Dialog.Description className="mt-4">
                        <p className="text-sm text-gray-500">
                          {t(
                            'ThereWasAnErrorCancellingTheAppointment',
                            'There was an error cancelling the appointment',
                          )}
                        </p>
                        {err.code && <p className="text-sm text-gray-500">{
                          err.code === 'already-canceled' ? t(
                            'ThisAppointmentHasAlreadyBeenCanceledOrCheckedIn',
                            'This appointment has already been canceled or checked in',
                          ) : err.code}</p>}
                        {err.trace && (
                          <p className="text-sm text-gray-500">Trace ID: {err.trace}</p>
                        )}
                      </Dialog.Description>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6">
                    <button
                      type="button"
                      className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-f-light-green text-base font-medium text-white hover:bg-f-dark-green focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-f-light-green sm:text-sm"
                      onClick={() => {
                        payload.onClose?.();
                        closeModal();
                      }}
                    >
                      {t('Close', 'Close')}
                    </button>
                  </div>
                </>
              ),
            },
          }}
          start="choose-reason"
          initialState={{}}
        >
          <WizardSteps />
        </Wizard>
      </div>
    </Modal>
  );
}
