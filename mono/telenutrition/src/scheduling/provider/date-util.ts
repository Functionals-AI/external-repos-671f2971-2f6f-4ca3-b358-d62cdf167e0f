import { ProviderMetricsDateRangeType } from "./types";
import { DateTime } from 'luxon';

function currentDateTime(timezone: string) {
  return DateTime.now().setZone(timezone);
}

export function calculateMondayOfTheWeek(timezone: string): string{
  const monday = currentDateTime(timezone).startOf('week');
  return monday.toISODate()!;
}

export function calculateDateRange(
    metricsDateRangeConfig: Exclude<ProviderMetricsDateRangeType, ProviderMetricsDateRangeType.Custom>, timezone: string
  ): { startDate: string; endDate: string } {
  
    const currentDate = currentDateTime(timezone);
    let startDate = currentDateTime(timezone);
    let endDate = currentDateTime(timezone);
  
    switch (metricsDateRangeConfig) {
      case ProviderMetricsDateRangeType.Today:
        startDate = currentDate;
        endDate = currentDate;
        break;  
      case ProviderMetricsDateRangeType.MonthToDate:
        startDate = startDate.set({ day: 1 });
        endDate = currentDate;
        break;
      case ProviderMetricsDateRangeType.WeekToDate:
        startDate = currentDate.startOf('week');
        endDate = currentDate;
        break;
      case ProviderMetricsDateRangeType.LastMonth:
        startDate = currentDate.minus({ months: 1 }).set({ day: 1 });
        endDate = currentDate.startOf('month').minus({ day: 1 });
        break;
      default:
        throw new Error(`Unsupported date range type: ${metricsDateRangeConfig}`);
    }

    return {
      startDate: startDate.toISODate()!,
      endDate: endDate.toISODate()!,
    };
}
  
export function calculateComparisonDateRange(
    startDate: string,
    metricsDateRangeConfig: ProviderMetricsDateRangeType,
  ): { comparisonStartDate: string | null; comparisonEndDate: string | null } {  
    const targetStartDate = DateTime.fromISO(startDate);
    let comparisonStartDate = DateTime.fromISO(startDate);
    let comparisonEndDate = DateTime.fromISO(startDate);
    
    switch (metricsDateRangeConfig) {
      case ProviderMetricsDateRangeType.WeekToDate:
        comparisonStartDate = targetStartDate.startOf('week').minus({ weeks: 1 });
        comparisonEndDate = targetStartDate.startOf('week').minus({ days: 1 });
        break;
      
      case ProviderMetricsDateRangeType.MonthToDate:
      case ProviderMetricsDateRangeType.LastMonth:
        comparisonStartDate = targetStartDate.minus({ months: 1 }).set({ day: 1 });
        comparisonEndDate = targetStartDate.startOf('month').minus({ days: 1 });
        break;
     
      default:
        return { comparisonStartDate: null, comparisonEndDate: null };
    }
    return {
      comparisonStartDate: comparisonStartDate.toISODate()!,
      comparisonEndDate: comparisonEndDate.toISODate()!,
    };
}