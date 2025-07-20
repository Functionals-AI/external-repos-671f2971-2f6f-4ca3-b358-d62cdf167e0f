import { zc } from '@mono/common/lib/zod-custom';
import { PatientRecord } from '../patient/store';
import { PaymentMethodRecord } from '../payment/store';
import { z } from 'zod';
import { DailyUnitsBilled } from './shared';

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

type HouseholdMemberSchedulableInfo = {
  canSchedule: true;
  defaultPaymentMethod: PaymentMethodRecord;
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

type HouseholdMemberNonSchedulableInfo = {
  canSchedule: false;
  errors: ProviderScheduleForPatientDisallowReason[];
};

type HouseholdMemberSchedulingInfo = {
  schedulingInfo: HouseholdMemberSchedulableInfo | HouseholdMemberNonSchedulableInfo;
};

export type HouseholdMember = PatientRecord & {
  nextSession?: string | null;
  lastSession?: string | null;
};

export type HouseholdMemberWithSchedulingInfo = HouseholdMember & HouseholdMemberSchedulingInfo;

export interface Household {
  userId: number;
  identityId?: number;
  members: HouseholdMemberWithSchedulingInfo[];
}

export interface ProviderPerformanceMetrics {
  totalUnitsBilled: number;
  unitsBilledPerBusinessDay: number;
  unitsBilledPerCompletedVisits: number | null;
  patientPersistenceRate: number | null;
  unitsBilledPerBDayDiff?: number | null;
  unitsBilledPerCVDiff?: number | null;
}

export interface ProviderPerformanceMetricsAPIResult extends ProviderPerformanceMetrics {
  unitsBilledByDay: DailyUnitsBilled[];
  startDate: string;
  endDate: string;
  comparisonStartDate: string | null;
  comparisonEndDate: string | null;
}

export enum ProviderMetricsDateRangeType {
  MonthToDate = 'month_to_date',
  WeekToDate = 'week_to_date',
  LastMonth = 'last_month',
  Today = 'today',
  Custom = 'custom',
}

const CustomDateRangeMetricsParamsSchema = z.object({
  startDate: zc.dateString(),
  endDate: zc.dateString(),
  timezone: z.string(),
  metricsDateRangeConfig: z.literal(ProviderMetricsDateRangeType.Custom),
});

const NonCustomDateRangeMetricsParamsSchema = z.object({
  timezone: z.string(),
  metricsDateRangeConfig: z.enum([
    ProviderMetricsDateRangeType.MonthToDate,
    ProviderMetricsDateRangeType.WeekToDate,
    ProviderMetricsDateRangeType.Today,
    ProviderMetricsDateRangeType.LastMonth,
  ]),
});

// Create a discriminated union using the 'metricsDateRangeConfig' field
export const GetProviderPerformanceMetricsParamsSchema = z.discriminatedUnion('metricsDateRangeConfig', [
  CustomDateRangeMetricsParamsSchema,
  NonCustomDateRangeMetricsParamsSchema,
]);

export type ProviderPerformanceMetricsParams = z.infer<typeof GetProviderPerformanceMetricsParamsSchema>;
