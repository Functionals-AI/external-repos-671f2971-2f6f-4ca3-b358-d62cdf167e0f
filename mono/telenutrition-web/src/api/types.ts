import type {
  AppointmentEncounterRecord,
  AppointmentRecord as AppointmentRecordDateType,
  AudioSupport,
  EligibilityCheckType,
  GroupWidget,
  PatientRecord,
  PaymentCoverage,
  ProviderRecord,
  QuestionnaireDisplayValue,
  Timestamp,
} from '@mono/telenutrition/lib/types';

export type IsoDateString = `${number}-${number}-${number}`;

// The type AppointmentRecord used by the backend has a Date type, which is not expected here
export interface AppointmentRecord
  extends Omit<AppointmentRecordDateType, 'startAt' | 'startTimestamp'> {
  startAt: string;
  startTimestamp: string;
  encounterId?: number;
  encounter?: AppointmentEncounterRecord;
  provider?: ProviderRecord;
  bookable?: boolean;
  accountName?: string;
}

export interface PaymentMethodTypeRecord {
  id: number;
  label: string;
  method: string;
  insuranceId?: number;
  employerId?: number;
  audioSupport: AudioSupport;
  followUpDurations: number[];
  eligibilityCheckType: EligibilityCheckType;
  eligibilityOptional: boolean;
}

export interface PatientPaymentMethod {
  id: number;
  patientId: number;
  label: string;
  memberId?: string;
  payment: {
    method: 'plan' | 'employer' | 'self-pay';
    employer_id?: number;
    insurance_id?: number;
    member_id?: string;
    group_id?: string;
  };
  type: PaymentMethodTypeRecord;
  lastUsed?: string;
  eligibleId?: number;
  status: string;
  isValid: boolean;
  lastEligibilityCheck?: Date;
  coverage?: PaymentCoverage;
  oversightRequired?: boolean;
}

export interface AthenaAppointmentRecord {
  appointmentId: number;
  appointmentTypeId: number;
  departmentId: number;
  patientId?: number;
  providerId: number;
  duration: number;
  status: string;
  startDate: string;
  startTime: string;
  frozen: boolean;
  patient?: unknown;
  cancelReasonId?: number;
  rescheduledAppointmentId?: number;
  claims?: unknown[];
}

export type ProviderScheduleForPatientDisallowReason =
  | {
      type: 'error';
      code: string;
      message: string;
    }
  | {
      type: 'disallowed';
      reasonShort: string;
      reasonFull: string;
    };

export type HouseholdMemberSchedulableInfo = {
  canSchedule: true;
  defaultPaymentMethod: PatientPaymentMethod;
  patientPaymentMethods: PatientPaymentMethod[];
  validAppointmentDurations: number[];
  canScheduleAudioOnly:
    | {
        canSchedule: true;
        defaultValue: boolean;
      }
    | {
        canSchedule: false;
      };
};

export type HouseholdMemberNonSchedulableInfo = {
  canSchedule: false;
  errors: ProviderScheduleForPatientDisallowReason[];
};

type HouseholdMemberSchedulingInfo = {
  schedulingInfo: HouseholdMemberSchedulableInfo | HouseholdMemberNonSchedulableInfo;
};

export type HouseholdMemberSchedulable = HouseholdMember & {
  schedulingInfo: HouseholdMemberSchedulableInfo;
};

export type HouseholdMember = PatientRecord & {
  nextSession?: string;
  lastSession?: string;
};

export type HouseholdMemberWithSchedulingInfo = HouseholdMember & HouseholdMemberSchedulingInfo;
export type Household = {
  userId: number;
  identityId?: number;
  members: HouseholdMemberWithSchedulingInfo[];
};

export interface AppointmentActivityRecord {
  activityId: number;
  appointmentId: number;
  traceId: string;
  actionType: string;
  rescheduleAppointmentId?: number;
  scheduleAppointmentId?: number;
  note?: string;
  reason?: string;
  metadata?: any;
  userId?: number;
  createdAt: string;
}

export type ProviderLicenseRecord = {
  licenseId: number;
  source: string;
  medallionId?: string;
  providerId?: number;
  status?: string; // active | pending | inactive
  state: string;
  issueDate?: string;
  expirationDate?: string;
  licenseNumber?: string;
  certificateType: string;
  candidProvider_credentialing_span_id?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
  verificationStatus?: string; // needs_attention | manually_verified | automatically_verified
};

export interface ProviderLicenseApplicationRecord {
  licenseApplicationId: number;
  providerId: number;
  state: string;
  trackingNumber?: string;
  trackingMeta?: any;
  status?: string;
  submittedDate: string;
  attestedBy?: string;
  attestedAt?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export enum EncounterStatus {
  Open = 'open',
  Oversight = 'oversight',
  Closed = 'closed',
  Deleted = 'deleted',

  // To be removed
  ProviderResponseRequired = 'provider_response_required',
  ProviderChangesMade = 'provider_changes_made',
}

export enum EncounterOversightStatus {
  PendingReview = 'pending_review',
  ProviderResponseRequired = 'provider_response_required',
  ProviderChangesMade = 'provider_changes_made',
  Approved = 'approved',
  Rejected = 'rejected',
}

export type UserEncounterRecord = {
  encounterId: number;
  actualStarttime?: Timestamp;
  actualEndtime?: Timestamp;
  noteToMember?: string;
  reasonForVisit?: string;
  providerName?: string;
  providerInitials: string;
  providerPhoto: string;
  patientName: string;
  isAudioOnly: boolean;
};

export interface HistoricalAthenaEncounterRecord {
  encounterId: number;
  appointmentId?: number;
  patientId?: number;
  rawData?: Record<string, any>;
  encounterDate?: Date;
}

export type ConfigGroup = {
  key: string;
  groups: GroupWidget[];
};

export type HistoricalEncounterValue = {
  date: string;
  value: any;
  display: string;
};

export type ChartingV1Config = {
  config: ChartingConfig;
  defaultValues: Record<string, string | number>;
  historicalEncounterValues: Record<string, HistoricalEncounterValue[]>;
};

export type ChartingConfig = {
  chartingGroups: ConfigGroup;
};

export type HistoricalEncounterData = {
  type: 'historical';
  historicalEncounter?: Omit<AppointmentEncounterRecord, 'type'> & { type: 'historical' };
};

export type AppEncounterData = {
  type: 'app';
  encounter: AppointmentEncounterRecord | null;
};

export type ExtendedAppEncounterData = AppEncounterData & {
  chartingConfig: ChartingV1Config;
  oversightRequired: boolean;
};

export type CompleteAppEncounterData = {
  type: 'app-complete';
  encounter: AppointmentEncounterRecord;
  displayChartingData: QuestionnaireDisplayValue[];
};

export type EncounterData = HistoricalEncounterData | AppEncounterData | CompleteAppEncounterData;

export function isAppEncounterData(encounter: EncounterData): encounter is AppEncounterData {
  return encounter.type === 'app';
}

export function isAppEncounterDataComplete(
  encounter: EncounterData,
): encounter is CompleteAppEncounterData {
  return encounter.type === 'app-complete';
}

export function isHistoricalEncounterData(
  encounter: EncounterData,
): encounter is HistoricalEncounterData {
  return encounter.type === 'historical';
}
