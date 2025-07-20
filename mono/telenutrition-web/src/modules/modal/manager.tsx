import { useAppStateContext } from '../../state/context';
import { Modal, ModalButtonState } from '../../state/types/modal';
import CustomResponseModal from './custom-modal';
import ErrorModal from './error-modal';
import { ErrorIcon } from './icons';
import { useTranslation } from 'react-i18next';
import UpdateAccountInfoModal from './update-account-info-modal';
import { ApiRequestError } from '../../utils/errors';
import RequireAppConsentModal from './require-app-consent';
import AppointmentCancellationModal from './appointment-cancellation-modal';

export function useModalManager() {
  const {
    dispatch,
    appState: {
      modal: { isOpen },
    },
  } = useAppStateContext();
  const { t } = useTranslation();

  const closeModal = () => {
    dispatch({ type: 'CLOSE_MODAL' });
    setTimeout(() => {
      dispatch({ type: 'CLEAR_MODAL' });
    }, 500);
  };

  const openModal = (payload: Modal) => {
    dispatch({ type: 'SET_MODAL', payload });
    setTimeout(() => {
      dispatch({ type: 'REVEAL_MODAL' });
    }, 100);
  };

  const openBookingErrorModal = ({
    error,
    onChangeAppointmentClick,
  }: {
    error: any;
    onChangeAppointmentClick: () => void;
  }) => {
    openModal({
      type: 'Custom',
      prohibitClose: true,
      title: 'Booking Error',
      content: (
        <div>
          <p className="text-base text-gray-500">
            {t(
              'AppointmentAlreadyBooked',
              'Uh Oh! This appointment time has already been booked. Please select a different time.',
            )}
          </p>
          <p className="mt-3 text-sm text-gray-500">Trace ID: {error.trace}</p>
        </div>
      ),
      icon: <ErrorIcon />,
      buttons: {
        children: t('Change', 'Change'),
        onClick: () => {
          closeModal();
          onChangeAppointmentClick();
        },
      },
    });
  };

  function handleApiError({
    error,
    title,
    subtitle,
    prohibitClose = false,
    buttons,
  }: {
    error: ApiRequestError | Error;
    title?: string | null;
    subtitle?: string | null;
    prohibitClose?: boolean;
    buttons?: ModalButtonState | [ModalButtonState, ModalButtonState];
  }) {
    const defaultButton: ModalButtonState = {
      children: t('Close', 'Close'),
      onClick: closeModal,
    };

    let trace: string | undefined;
    if (error instanceof ApiRequestError) {
      trace = error.trace;
      subtitle = subtitle ?? error.message;
    }

    openModal({
      type: 'Custom',
      title: title ?? t('Error', 'Error'),
      content: (
        <>
          {!!subtitle || !!trace ? (
            <div>
              {!!subtitle && <p className="text-base text-gray-500">{subtitle}</p>}
              {!!trace && <p className="mt-3 text-sm text-gray-500">Trace ID: {trace}</p>}
            </div>
          ) : null}
        </>
      ),
      prohibitClose,
      buttons: buttons ?? defaultButton,
      icon: <ErrorIcon />,
    });
  }

  return { openModal, closeModal, openBookingErrorModal, isOpen, handleApiError };
}

export default function ModalManager() {
  const { appState } = useAppStateContext();
  const { closeModal } = useModalManager();

  const {
    modal: { modal, isOpen },
  } = appState;

  const defaultCloseModal = () => {
    if (modal && 'prohibitClose' in modal && modal.prohibitClose) return;

    closeModal();
  };

  return (
    <>
      {modal?.type === 'Error' && (
        <ErrorModal isOpen={isOpen} payload={modal} closeModal={defaultCloseModal} />
      )}
      {modal?.type === 'Custom' && (
        <CustomResponseModal isOpen={isOpen} payload={modal} closeModal={defaultCloseModal} />
      )}
      {modal?.type === 'UpdateAccountInfo' && (
        <UpdateAccountInfoModal isOpen={isOpen} payload={modal} closeModal={defaultCloseModal} />
      )}
      {modal?.type === 'AppointmentCancellation' && (
        <AppointmentCancellationModal
          isOpen={isOpen}
          payload={modal}
          closeModal={defaultCloseModal}
        />
      )}
      {modal?.type === 'RequireAppConsent' && (
        <RequireAppConsentModal isOpen={isOpen} payload={modal} closeModal={defaultCloseModal} />
      )}
    </>
  );
}
