import { ChartingV1ConfigResult } from '../questionnaire/service';
import { QuestionnaireDisplayValue } from '../questionnaire/types';
import type { AppointmentEncounterRecord } from './shared';
import { z } from 'zod';

export type HistoricalEncounterData = {
  type: Extract<EncounterType, 'historical'>;
  historicalEncounter?: Omit<AppointmentEncounterRecord, 'type'> & { type: 'historical' };
};

export type AppEncounterData = {
  type: Extract<EncounterType, 'app'>;
  encounter: AppointmentEncounterRecord | null;
};

export type ExtendedAppEncounterData = AppEncounterData & {
  chartingConfig: ChartingV1ConfigResult;
  oversightRequired: boolean;
};

export type CompleteAppEncounterData = {
  type: Extract<EncounterType, 'app-complete'>;
  encounter: AppointmentEncounterRecord;
  // If includeEncounterData = false, omit this data.
  displayChartingData?: QuestionnaireDisplayValue[];
};

export const encounterTypeSchema = z.union([z.literal('historical'), z.literal('app'), z.literal('app-complete')]);
export type EncounterType = z.infer<typeof encounterTypeSchema>;

export type EncounterData = HistoricalEncounterData | AppEncounterData | CompleteAppEncounterData;

