import { UseGetAccountReturn } from '../../api/account/useGetAccount';
import { ButtonProps } from '../../components/button';
import type { AppointmentRecord } from '@mono/telenutrition/lib/types';
import { AppointmentCancelReason } from 'api/usePutCancelAppointment';

export type ModalButtonState = ButtonProps;

export interface ErrorState {
  title: string;
  subtitle: string;
  code?: string;
  trace?: string;
}

export interface CustomModalState {
  icon?: JSX.Element;
  title: string;
  content?: string | JSX.Element | null;
  buttons?: ModalButtonState | [ModalButtonState, ModalButtonState];
}

export interface ProviderScheduledAppointmentModalState {
  appointment: AppointmentRecord;
}
export interface ProviderScheduledAppointmentConflictingModalState {
  appointments: {
    appt1: AppointmentRecord;
    appt2: AppointmentRecord;
  };
  onClose?: () => void;
}

export function isTwoButtons(buttons: any): buttons is [ModalButtonState, ModalButtonState] {
  return Array.isArray(buttons);
}

export type UpdateAccountInfoModalState = {
  currentAccountFields: UseGetAccountReturn;
};

export type AppointmentCancellationModalState = {
  appointmentId: number;
  forcedCancelReason?: AppointmentCancelReason;
  onClose?: () => void;
};

type ErrorModal = { type: 'Error'; prohibitClose?: boolean } & ErrorState;
type CustomModal = { type: 'Custom'; prohibitClose?: boolean } & CustomModalState;
type UpdateAccountInfoModal = {
  type: 'UpdateAccountInfo';
} & UpdateAccountInfoModalState;
type RequireAppConsentModalState = {
  type: 'RequireAppConsent';
  prohibitClose: true;
};
type AppointmentCancellationModal = {
  type: 'AppointmentCancellation';
} & AppointmentCancellationModalState;

export type Modal =
  | ErrorModal
  | CustomModal
  | UpdateAccountInfoModal
  | RequireAppConsentModalState
  | AppointmentCancellationModal;
