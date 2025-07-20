import { z } from "zod";

export interface DailyUnitsBilled {
  appointmentDate: string;
  unitsBilled: number;
}

export interface ProviderTaskRecord {
  taskId: number;
  providerId: number;
  name: string;
  priority: string;
  status: string;
  updatedAt: string;
  note?: string;
  dueDate?: string;
  createdAt: string;
}

export type ProviderRecord = {
  providerId: number;
  firstName: string;
  lastName: string;
  name: string;
  photo: string;
  languages?: string[];
  npi?: number;
  oktaId?: string;
  timezone?: string;
  initials: string;
  homePhone?: string;
  homeEmail?: string;
  homeZipcode?: string;
  employmentStatus?: string;
  capacityProviderGroup?: string;
  certifications: number[];
  specialtyIds?: string[];
  pediatrics?: boolean;
  status: number;
  email?: string;
  credentialingCommitteeStatus?: string;
  minPatientAge: number;
  bio?: string;
};

export type ProviderRecordShort = Pick<
  ProviderRecord,
  'providerId' | 'name' | 'photo' | 'initials' | 'languages'
>;

export const providerSpecialtySchema = z.enum([
  'allergies', 'bariatric', 'cardiology', 'diabetes_metabolic_health', 'eating_disorders',
  'gastroenterology', 'geriatrics', 'maternal_prenatal_health', 'mental_behavioral_health',
  'obesity_weight_management', 'oncology_cancer', 'renal', 'skin_health', 'sports_nutrition',
  'transplant', 'womens_health'
])
export type ProviderSpecialty = z.infer<typeof providerSpecialtySchema>

export const providerTimezoneSchema = z.enum([
  'America/Puerto_Rico',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Juneau',
  'America/Phoenix',
  'Pacific/Honolulu'
])
export type ProviderTimezone = z.infer<typeof providerTimezoneSchema>

export const providerLanguageSchema = z.enum([
  'en',
  'es',
  'ar',
  'po',
  'ru',
  'fa',
  'fr',
  'cmn', // ISO 639-3
  'yue', // ISO 639-3
  'vi',
  'ko'
])
export type ProviderLanguage = z.infer<typeof providerLanguageSchema>

export interface ProviderOIdParams {
  providerOId: string;
}

export interface GetProviderPastPatientsParams {
  providerOId: string;
  offset: number;
  limit: number;
  sortBy: 'patientName' | 'lastSession' | 'nextSession';
  sortOrder: 'asc' | 'desc';
  daysSinceLastSession?: number;
  paymentMethodTypeIds?: number[];
  patientIdNameQuery?: string;
}
