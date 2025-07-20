import { UsersEligibleStoreRecord } from "@mono/foodapp/lib/store/users-eligible";
import { FlowStateReferralRecord } from "../scheduling-flow/types";

export interface ReferrerRecord {
  referrerId: number;
  firstName: string;
  lastName: string;
  email: string;
  organization?: string;
  orgId?: number;
  credentials?: string;
}

export type InsertReferrerRecord = Omit<
  ReferrerRecord,
  "referrerId" | "organization" | "orgId"
> & { orgId: NonNullable<ReferrerRecord["orgId"]> };


export type ReferralData = FlowStateReferralRecord;

export interface ReferralRecord {
  referralId: number;
  referrerId: number;
  icd10Codes: string[];
  appointmentId?: number;
  patientId?: number;
  type: string;
  data?: ReferralData;
}

export type InsertReferralRecord = Omit<ReferralRecord, "referralId">;

export type CreateEligibleUserPayload = Pick<
  UsersEligibleStoreRecord,
  "organization_id"
> &
  Partial<Omit<UsersEligibleStoreRecord, "birthday">> & { birthday?: string };
