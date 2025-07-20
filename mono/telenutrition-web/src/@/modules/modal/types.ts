import { ReactNode } from 'react';
import { ButtonTheme } from '@/ui-components/button';
import { ModalSize } from './ui/modal';
import {
  AppointmentRecord,
  UserEncounterRecord,
  HouseholdMember,
  HouseholdMemberSchedulable, PatientPaymentMethod,
} from 'api/types';
import type { PatientRecord } from '@mono/telenutrition/lib/types';
import { DateTime } from 'luxon';
import { TimeSlot } from '@/selectors/calendarItemsSelector/helpers';
import { IconProps } from '@/ui-components/icons/Icon';

export type ModalData =
  | BasicModalData
  | DialogModalData
  | BasicDialogModalData
  | RescheduleSessionModalData
  | CancelSessionModalData
  | FreezeSlotModalData
  | ScheduleSessionModalData
  | ScheduleSessionModalV2Data
  | ScheduleVisitSelfModalData
  | ScheduleVisitOtherKnownModalData
  | ScheduleVisitOtherUnknownModalData
  | ScheduleSlotOptionsCreateModalData
  | RescheduleVisitSelfModalData
  | RescheduleVisitOtherKnownModalData
  | RescheduleVisitOtherUnknownModalData
  | ScheduleSlotOptionsEditModalData
  | AddHouseholdMemberModalData
  | CustomModalData
  | UnfreezeSlotModalData
  | ResolveConflictsModalData
  | AddTaskModalData
  | StickyNotesModalData
  | AfterVisitSummaryModalData
  | PromptProviderLoginModalData
  | RescheduleSessionModalV2Data
  | CoverageDetailsModalData
  | OverbookingConfirmationModalData;

interface BaseModal {
  onSuccess?: () => void;
  // Default hide close button
  showCloseButton?: boolean;
}

export interface CustomModalData extends BaseModal {
  type: 'custom';
  modal: ReactNode;
}

export interface BasicModalData extends BaseModal {
  type: 'basic';
  title: string;
  body: ReactNode;
  size?: ModalSize;
  footer?: ReactNode;
}

export interface DialogModalData extends BaseModal {
  type: 'dialog';
  title: ReactNode;
  body: ReactNode;
  theme?: ButtonTheme;
  icon?: IconProps;
  footer?: ReactNode;
}

export interface BasicDialogModalData extends BaseModal {
  type: 'basic-dialog';
  title: string;
  body: ReactNode;
  theme?: ButtonTheme;
  icon?: IconProps;
  secondaryButton?: {
    text: string;
    onClick: () => void;
  };
  primaryButton: {
    text: string;
    onClick: () => void;
  };
}

export interface RescheduleSessionModalData extends BaseModal {
  type: 'reschedule-session';
  rescheduleAppointment: AppointmentRecord;
}

export interface CancelSessionModalData extends BaseModal {
  type: 'cancel-session';
  appointment: AppointmentRecord;
}

export interface FreezeSlotModalData extends BaseModal {
  type: 'freeze-slot';
  appointmentIds: {
    primary: number;
    secondary?: number;
  };
  dateDisplay: string;
  timeDisplay: string;
  dateTime: DateTime;
  appointmentsByDay?: Record<string, AppointmentRecord[]>;
}

export interface UnfreezeSlotModalData extends BaseModal {
  type: 'unfreeze-slot';
  date: Date;
  duration: number;
  timeDisplay: string;
}

export interface ScheduleSessionModalData extends BaseModal {
  type: 'schedule-session';
  appointmentIds: {
    primary: number;
    secondary?: number;
  };
  dateDisplay: string;
  timeDisplay: string;
  dateTime: DateTime;
}

export interface ScheduleSessionModalV2Data extends BaseModal {
  type: 'schedule-session-v2';
  patient?: HouseholdMemberSchedulable;
}

export interface RescheduleSessionModalV2Data extends BaseModal {
  type: 'reschedule-session-v2';
  rescheduleAppointment: AppointmentRecord;
}

export interface ScheduleVisitSelfModalData extends BaseModal {
  type: 'schedule-visit-self';
  patient: HouseholdMemberSchedulable;
}

export interface ScheduleVisitOtherKnownModalData extends BaseModal {
  type: 'schedule-with-other-known';
  patient: HouseholdMemberSchedulable;
}

export interface ScheduleVisitOtherUnknownModalData extends BaseModal {
  type: 'schedule-with-other-unknown';
  patient: HouseholdMemberSchedulable;
}

export interface RescheduleVisitSelfModalData extends BaseModal {
  type: 'reschedule-visit-self';
  patient: PatientRecord;
  rescheduleAppointment: AppointmentRecord;
}

export interface RescheduleVisitOtherKnownModalData extends BaseModal {
  type: 'reschedule-with-other-known';
  patient: PatientRecord;
  rescheduleAppointment: AppointmentRecord;
}

export interface RescheduleVisitOtherUnknownModalData extends BaseModal {
  type: 'reschedule-with-other-unknown';
  patient: PatientRecord;
  rescheduleAppointment: AppointmentRecord;
}


export interface ScheduleSlotOptionsEditModalData
  extends BaseModal,
    ScheduleSlotOptionsData,
    ScheduleSlotOptionsEditData {
  formType: 'edit';
}

export interface ScheduleSlotOptionsCreateModalData
  extends BaseModal,
    ScheduleSlotOptionsData,
    ScheduleSlotOptionsCreateData {
  formType: 'create';
}

interface ScheduleSlotOptionsData {
  type: 'schedule-slot-options';
  appointmentsByDay: any;
  onComplete: any;
  defaultValues: any;
  durationDisabled: any;
  displayTime: any;
  sessionTypeDisabled: boolean;
  displayTimeFooter: any;
}

export type ScheduleSlotOptionsEditData = {
  formType: 'edit';
  appointmentIds: number[];
};
export type ScheduleSlotOptionsCreateData = {
  formType: 'create';
  appointmentIds: {
    primary: number;
    secondary?: number;
  };
  duration: 30 | 60;
};

export interface ResolveConflictsModalData extends BaseModal {
  type: 'resolve-conflicts';
  timeSlot: TimeSlot;
}

export interface AddHouseholdMemberModalData extends BaseModal {
  type: 'add-household-member';
  holder: HouseholdMember;
  holderUserId: number;
}

export interface AddTaskModalData extends BaseModal {
  type: 'add-task';
}

export interface StickyNotesModalData extends BaseModal {
  type: 'sticky-notes';
  initialStep: 'create' | 'list';
  patientId: number;
  sourceType?: string;
  sourceId?: number;
}

export interface PromptProviderLoginModalData extends BaseModal {
  type: 'prompt-provider-login';
}

export interface AfterVisitSummaryModalData extends BaseModal {
  type: 'after-visit-summary';
  encounter: UserEncounterRecord;
}

export interface CoverageDetailsModalData extends BaseModal {
  type: 'coverage-details';
  paymentMethod: PatientPaymentMethod;
}

export interface OverbookingConfirmationModalData extends BaseModal {
  type: 'overbooking-confirmation';
  appointment: AppointmentRecord;
}

export type ModalState<
  Modal1 extends ModalData = ModalData,
  Modal2 extends ModalData = ModalData,
> = {
  isVisible: boolean;
  modals: null | {
    primary: Modal1;
    secondary?: Modal2;
  };
  openPrimary: (modal: ModalData) => void;
  openSecondary: (modal: ModalData) => void;
  closeAll: (type?: 'success' | 'error') => void;
  closeSecondary: () => void;
};

// Modal may not be "isOpen", but will be selected and present in the dom (possibly transitioning)
export type SelectedModalState<T extends ModalData> = Omit<ModalState<T>, 'modal'> & {
  modals: NonNullable<ModalState<T>['modals']>;
};

export function isModalSelected<T extends ModalData>(
  state: ModalState<T>,
): state is SelectedModalState<T> {
  return !!state.modals;
}

export function isModalMatchToType<T extends ModalData['type'], M extends ModalData>(
  context: ModalState<ModalData>,
  type: ModalData['type'],
): context is ModalState<Extract<M, { type: T }>> {
  return context.modals?.primary?.type === type;
}
