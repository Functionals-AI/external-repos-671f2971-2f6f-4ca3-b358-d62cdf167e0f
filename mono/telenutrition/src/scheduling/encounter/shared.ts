import { z } from 'zod';
import type { Timestamp } from '../../types/time';

export const amendmentReasonSchema = z.enum(['technical_error', 'duration_unit_error', 'incorrect_cpt_code', 'typo', 'other'])
export type AmendmentReason = z.infer<typeof amendmentReasonSchema>

export type DRCCategory = 'excluded' | 'included';

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

export type EncounterAmendmentStatus = 'pending' | 'approved' | 'rejected';

export type EncounterAmendmentRecord = {
  amendmentId: number;
  encounterId: number;
  unitsBilled?: number;
  billingCode?: string;
  reason?: AmendmentReason;
  comments?: string;
  status: EncounterAmendmentStatus;
  createdAt: Timestamp;
  resolvedAt: Timestamp;
  resolvedBy: string;
};

export interface AppointmentEncounterRecord {
  type?: 'app' | 'historical';
  encounterId: number;
  patientId?: number;
  appointmentId?: number;
  departmentId?: number;
  providerId?: number;
  encounterType?: string;
  encounterDate?: Timestamp;
  actualStarttime?: Timestamp;
  encounterStatus?: EncounterStatus;
  oversightStatus?: EncounterOversightStatus;
  createdBy?: string;
  assignedTo?: string;
  closedDatetime?: Timestamp;
  closedBy?: string;
  deletedDatetime?: Timestamp;
  deletedBy?: string;
  specialty?: string;
  billingTabReviewed?: string;
  documentedBy?: string;
  closeAttemptedYn?: string;
  lastReopened?: Timestamp;
  lastModified?: Timestamp;
  previouslyClosedDatetime?: Timestamp;
  cancelReasonNote?: string;
  patientStatusId?: number;
  lastReopenedBy?: string;
  previouslyClosedBy?: string;
  specialtyId?: string;
  actualEndtime?: Timestamp;
  totalMinutes?: number;
  unitsBilled?: number;
  diagnosisCode?: string;
  billingCode?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  rawData?: Record<string, any>;
  timerStartedAt?: Timestamp;
  timerEndedAt?: Timestamp;
  oversightComment?: string;
  oversightBy?: string;
  oversightAt?: Timestamp;
}