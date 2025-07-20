import * as db from "zapatos/db";
import { PatientRecord } from "../patient/patient-record";
import { DateTime } from "luxon";
import { AppointmentTypeId } from "../flow-v2/constants";

export type ClaimRecord = Record<string, unknown>;

export type AppointmentMeeting = {
  schemaType: 'zoom_dynamic';
  id: number;
  link: string;
  shortLink: string;
  externalLink?: string;
} | {
  schemaType: 'waiting';
  link: string;
  shortLink: string;
};

export interface BaseAppointmentRecord {
  appointmentId: number;
  appointmentTypeId: number;
  departmentId: number;
  patientId?: number;
  providerId?: number;
  duration: number;
  status: string;
  // Deprecate soon
  startDate: string;
  // Deprecate soon
  startTime: string;
  frozen: boolean;
  cancelReasonId?: number;
  startTimestamp: Date;
  meeting?: AppointmentMeeting;
}

export interface AppointmentRecord extends BaseAppointmentRecord {
  startAt: Date;
  userId?: number;
  patient?: PatientRecord;
  date: string;
  paymentMethodId?: number;
  acceptedPaymentMethodId?: number;
  isAudioOnly: boolean;
  appointmentTypeDisplay?: string;
  isFollowUp: boolean;
  oversightRequired?: boolean;
  accountName?: string;
}

export type AppointmentStoreRecord = db.JSONOnlyColsForTable<
  "telenutrition.schedule_appointment",
  (
    | "provider_id"
    | "appointment_id"
    | "duration"
  )[]
> &
  db.ExtrasResult<
    "telenutrition.schedule_appointment",
    { start_timestamp: db.SQLFragment<db.TimestampString, never> }
  >;

export interface AppointmentSlotRecord {
  appointmentIds: number[];
  providerId?: number;
  startTimestamp: DateTime<true>;
  duration: number;
}

export type GroupedAppointmentSlots = {
  providerId?: number;
  appointments: (Omit<AppointmentSlotRecord, 'startTimestamp' | 'providerId'> & {
    startTimestamp: string
  })[];
  date: string; // MM/DD/YYYY
};

export type ValidAppointmentSlotDuration = "30-only" | "60-only" | "30-or-60";


export enum AppointmentType {
  Initial,
  FollowUp
}