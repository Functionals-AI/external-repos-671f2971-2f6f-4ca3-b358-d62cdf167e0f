import { Result, err, ok } from 'neverthrow';
import { isQuestionWidget, QuestionWidget, QuestionnaireDisplayValue, Widget } from './types';
import { ErrCode, ErrCodeError } from '@mono/common/lib/error';
import { IContext } from '@mono/common/lib/context';
import { Logger } from '@mono/common';
import Appointment from '../appointment';
import * as db from 'zapatos/db';
import { AccountIds } from '@mono/common/lib/account/service';
import { riskAssessmentConfig } from './questionnaires/risk-assessment';
import { z } from 'zod';
import { AppointmentRecord } from '../appointment/types';
import { ChartingConfig, chartingV1Config, ChartingV1Config } from './questionnaires/charting_v1';
import { extractQuestionWidgets, findWidgetInConfig, getSchemaForWidget, questionSchemaMap } from './helpers';
import { DateTime } from 'luxon';
import * as zs from 'zapatos/schema';
import _ = require('lodash');
import Provider from '../provider';
import { getPastFFDEncountersForPatient } from '../encounter/store';

const MTAG = Logger.tag();

export const ScreeningQuestionnaireTypeSchema = z.enum(['risk_assessment']);
export type ScreeningQuestionnaireType = z.infer<typeof ScreeningQuestionnaireTypeSchema>;

export type ScreeningDeterminationCode = 'low_risk' | 'medium_risk' | 'high_risk';

export type ScreeningDetermination = {
  title: string;
  sections: {
    title: string;
    text: string;
  }[];
};

export type TakeableScreeningQuestionnaire = {
  status: 'takeable';
  questionnaireType: ScreeningQuestionnaireType;
  title: string;
  caption: string;
  widgets: Widget[];
  defaults?: object;
  lastTakenAt?: string;
};
export type DeterminedScreeningQuestionnaire = {
  status: 'determined';
  questionnaireType: ScreeningQuestionnaireType;
  title: string;
  determination: ScreeningDetermination;
  lastTakenAt?: string;
};
export type ScreeningQuestionnaire = TakeableScreeningQuestionnaire | DeterminedScreeningQuestionnaire;

interface DetermineValidScreeningQuestionnaireTypesParams {
  appointment: AppointmentRecord;
  pastSubmissions: zs.telenutrition.clinical_encounter_screening_questionnaire.JSONSelectable[];
  experimental?: boolean;
}

type ScreeningQuestionnaireAccessType = 'view' | 'edit';

interface ScreeningQuestionnaireAccess {
  questionnaireType: ScreeningQuestionnaireType;
  accessType: ScreeningQuestionnaireAccessType;
}

export function determineScreeningQuestionnaireAccess(
  context: IContext,
  params: DetermineValidScreeningQuestionnaireTypesParams,
): Result<ScreeningQuestionnaireAccess[], ErrCode> {
  const TAG = [...MTAG, 'determineScreeningQuestionnaireAccess'];
  const { logger } = context;

  try {
    const { appointment, pastSubmissions, experimental } = params;
    const accountId = appointment.patient?.accountId;

    const sortedPastSubmissions = _.orderBy(pastSubmissions, (ps) => ps.created_at, 'desc');

    const validQuestionnaireTypes: ScreeningQuestionnaireAccess[] = [];
    if (accountId === AccountIds.CalOptima || accountId === AccountIds.SantaClara) {
      const pastQuestionnaireTypes: string[] = ['risk_assessment'] satisfies ScreeningQuestionnaireType[];
      const lastSubmission = sortedPastSubmissions.find((ps) => pastQuestionnaireTypes.includes(ps.questionnaire_type));

      const minDaysToRetake = accountId === AccountIds.CalOptima ? 21 : 70;
      const canEdit =
        !lastSubmission ||
        DateTime.fromISO(lastSubmission.created_at) < DateTime.now().minus({ days: minDaysToRetake });

      validQuestionnaireTypes.push({
        questionnaireType: 'risk_assessment',
        accessType: canEdit ? 'edit' : 'view',
      });
    }

    return ok(validQuestionnaireTypes);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

interface ValidateScreeningQuestionnaireTypeParams extends DetermineValidScreeningQuestionnaireTypesParams {
  questionnaireType: ScreeningQuestionnaireType;
  accessType: ScreeningQuestionnaireAccessType;
}

export function validateScreeningQuestionnaireAccess(
  context: IContext,
  params: ValidateScreeningQuestionnaireTypeParams,
): Result<boolean, ErrCode> {
  const TAG = [...MTAG, 'validateScreeningQuestionnaireAccess'];
  const { logger } = context;

  try {
    const { appointment, pastSubmissions, experimental, questionnaireType, accessType } = params;

    const determineResult = determineScreeningQuestionnaireAccess(context, {
      appointment,
      pastSubmissions,
      experimental,
    });
    if (determineResult.isErr()) {
      logger.error(context, TAG, 'error determining questionnaire access', params);
      return err(ErrCode.SERVICE);
    }
    const questionnaireAccesses = determineResult.value;

    const validAccess = questionnaireAccesses.find(
      (qa) => qa.accessType === accessType && qa.questionnaireType === questionnaireType,
    );

    return ok(validAccess !== undefined);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

type GetScreeningQuestionnairesParams = {
  appointmentId: number;
  experimental?: boolean;
};

export async function getScreeningQuestionnairesForAppointment(
  context: IContext,
  params: GetScreeningQuestionnairesParams,
): Promise<Result<ScreeningQuestionnaire[], ErrCode>> {
  const TAG = [...MTAG, 'getScreeningQuestionnairesForAppointment'];
  const { logger, store } = context;

  try {
    const pool = await store.reader();
    const { appointmentId, experimental } = params;

    // Get the appointment
    const appointmentResult = await Appointment.Service.getAppointment(context, { appointmentId });
    if (appointmentResult.isErr()) {
      logger.error(context, TAG, 'error getting appointment during get questionnaire for appt', { appointmentId });
      return err(ErrCode.SERVICE);
    }
    const appointment = appointmentResult.value;
    if (!appointment.patient) {
      return ok([]);
    }

    const accountId = appointment.patient.accountId;
    if (!accountId) {
      return ok([]);
    }

    // Get the questionnaire configs
    const allQuestionnaireConfigsResult = await getAllScreeningQuestionnaireConfigs(context, { accountId });
    if (allQuestionnaireConfigsResult.isErr()) {
      logger.error(context, TAG, 'error getting questionnaire configs during get questionnaire for appt', {
        appointmentId,
      });
      return err(ErrCode.SERVICE);
    }
    const allQuestionnaireConfigs = allQuestionnaireConfigsResult.value;

    // Fetch the past submissions
    const pastSubmissions = await db
      .select(
        'telenutrition.clinical_encounter_screening_questionnaire',
        {
          patient_id: appointment.patientId,
        },
        {
          order: { by: 'created_at', direction: 'DESC' },
        },
      )
      .run(pool);

    // Determine which questionnaires to assign to the appointment
    const determineAccessResult = determineScreeningQuestionnaireAccess(context, {
      appointment,
      pastSubmissions,
      experimental,
    });
    if (determineAccessResult.isErr()) {
      logger.error(
        context,
        TAG,
        'error determining valid screening questionnaires types during get questionnaire for appt',
        { appointmentId, experimental },
      );
      return err(ErrCode.SERVICE);
    }
    const questionnaireAccesses = determineAccessResult.value;

    // Build the questionnaires
    const questionnaires: ScreeningQuestionnaire[] = [];
    for (const qc of allQuestionnaireConfigs) {
      const questionnaireAccess = questionnaireAccesses.find((qa) => qa.questionnaireType === qc.questionnaireType);
      if (!questionnaireAccess) {
        continue;
      }

      const viewable = questionnaireAccess.accessType === 'view' || questionnaireAccess.accessType === 'edit';
      const editable = questionnaireAccess.accessType === 'edit';

      const pastSubmission = pastSubmissions.find((ps) => ps.questionnaire_type === qc.questionnaireType);
      const determinationCode = pastSubmission?.determination_code as ScreeningDeterminationCode | undefined;

      const determinationResult = determinationCode ? qc.buildDetermination(context, determinationCode) : undefined;
      if (determinationResult !== undefined && determinationResult.isErr()) {
        logger.error(context, TAG, 'error building determination during get questionnaires', {
          appointmentId,
          questionnaireType: qc.questionnaireType,
        });
        return err(ErrCode.SERVICE);
      }
      const determination = determinationResult ? determinationResult.value : undefined;

      if (editable) {
        questionnaires.push({
          status: 'takeable',
          questionnaireType: qc.questionnaireType,
          title: qc.title,
          caption: qc.caption,
          defaults: {},
          widgets: qc.widgets,
          lastTakenAt: pastSubmission?.created_at,
        });
      } else if (viewable && determination) {
        questionnaires.push({
          status: 'determined',
          questionnaireType: qc.questionnaireType,
          title: qc.title,
          determination,
          lastTakenAt: pastSubmission?.created_at,
        });
      }
    }

    return ok(questionnaires);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

interface SubmitScreeningQuestionnaireParams {
  appointmentId: number;
  questionnaireType: ScreeningQuestionnaireType;
  formData: unknown;
  experimental?: boolean;
}

interface SubmitScreeningQuestionnaireError {
  code: ErrCode;
  issues?: z.ZodIssue[];
}

export async function submitScreeningQuestionnaire(
  context: IContext,
  params: SubmitScreeningQuestionnaireParams,
): Promise<Result<DeterminedScreeningQuestionnaire, SubmitScreeningQuestionnaireError>> {
  const TAG = [...MTAG, 'submitScreeningQuestionnaire'];
  const { logger, store } = context;

  try {
    const wPool = await store.writer();

    const { appointmentId, questionnaireType, formData, experimental } = params;

    // Get the appointment
    const appointmentResult = await Appointment.Service.getAppointment(context, { appointmentId });
    if (appointmentResult.isErr()) {
      logger.error(context, TAG, 'error getting appointment during submit questionnaire', { appointmentId });
      return err({ code: ErrCode.SERVICE });
    }
    const appointment = appointmentResult.value;
    if (!appointment.patient) {
      logger.error(context, TAG, 'appointment is not tied to a patient during submit questionnaire', { appointmentId });
      return err({ code: ErrCode.SERVICE });
    }
    const patientId = appointment.patient.patientId;

    const accountId = appointment.patient.accountId;
    if (!accountId) {
      logger.error(context, TAG, 'patient is not tied to an account during submit questionnaire', { appointmentId });
      return err({ code: ErrCode.INVALID_DATA });
    }

    if (!appointment.providerId) {
      logger.error(context, TAG, 'cannot sumbit screening questionnaire for appointment without a provider', {
        appointmentId,
      });
      return err({ code: ErrCode.INVALID_DATA });
    }
    const providerId = appointment.providerId;

    // Get the questionnaire config
    const questionnaireConfigResult = await getScreeningQuestionnaireConfig(context, questionnaireType, { accountId });
    if (questionnaireConfigResult.isErr()) {
      logger.error(context, TAG, 'error getting questionnaire config during submit questionnaire', {
        appointmentId,
        questionnaireType,
      });
      return err({ code: ErrCode.SERVICE });
    }
    const questionnaireConfig = questionnaireConfigResult.value;

    // Transform the submission
    const transformSubmissionResult = questionnaireConfig.transformSubmission(context, formData);
    if (transformSubmissionResult.isErr()) {
      logger.error(context, TAG, 'error transforming submission during submit questionnaire', {
        appointmentId,
        questionnaireType,
      });
      return err(transformSubmissionResult.error);
    }
    const transformedSubmission = transformSubmissionResult.value;

    // Build the determination
    const determinationResult = questionnaireConfig.buildDetermination(
      context,
      transformedSubmission.determinationCode,
    );
    if (determinationResult.isErr()) {
      logger.error(context, TAG, 'error building determination during submit questionnaire', {
        appointmentId,
        questionnaireType,
      });
      return err({ code: ErrCode.SERVICE });
    }
    const determination = determinationResult.value;

    const updates = await db.serializable(wPool, async (txn) => {
      const pastSubmissions = await db
        .select('telenutrition.clinical_encounter_screening_questionnaire', {
          patient_id: patientId,
          questionnaire_type: questionnaireType,
        })
        .run(txn);

      const isValidAccessResult = validateScreeningQuestionnaireAccess(context, {
        questionnaireType,
        accessType: 'edit',
        appointment,
        pastSubmissions,
        experimental,
      });
      if (isValidAccessResult.isErr()) {
        logger.error(context, TAG, 'error validating questionnaire access during submit questionnaire', {
          questionnaireType,
          appointment,
          experimental,
        });
        throw new ErrCodeError(ErrCode.SERVICE);
      }
      const isValidAccess = isValidAccessResult.value;
      if (!isValidAccess) {
        logger.error(context, TAG, 'invalid questionnaire access during submit questionnaire', {
          questionnaireType,
          appointment,
          experimental,
        });
        throw new ErrCodeError(ErrCode.CONFLICT);
      }

      const insertedSubmission = await db
        .insert('telenutrition.clinical_encounter_screening_questionnaire', {
          appointment_id: appointment.appointmentId,
          patient_id: patientId,
          provider_id: providerId,
          questionnaire_type: questionnaireType,
          form_data: transformedSubmission.formData as any,
          determination_code: transformedSubmission.determinationCode,
          determination_meta: transformedSubmission.determinationMeta as any,
        })
        .run(txn);
      return { insertedSubmission };
    });

    logger.debug(context, TAG, 'inserted screening questionnaire response', {
      appointmentId,
      patientId,
      questionnaireType,
    });

    return ok({
      status: 'determined',
      questionnaireType: questionnaireConfig.questionnaireType,
      title: questionnaireConfig.title,
      determination,
      lastTakenAt: updates.insertedSubmission.created_at,
    });
  } catch (e) {
    logger.exception(context, TAG, e);
    return err({ code: e instanceof ErrCodeError ? e.code : ErrCode.EXCEPTION });
  }
}

type TransformedSubmission = {
  formData: object;
  determinationCode: ScreeningDeterminationCode;
  determinationMeta: object;
};

export type ScreeningQuestionnaireConfig = {
  questionnaireType: ScreeningQuestionnaireType;
  title: string;
  caption: string;
  widgets: Widget[];
  transformSubmission: (
    context: IContext,
    formData: unknown,
  ) => Result<TransformedSubmission, SubmitScreeningQuestionnaireError>;
  buildDetermination: (
    context: IContext,
    determinationCode: ScreeningDeterminationCode,
  ) => Result<ScreeningDetermination, ErrCode>;
};

export interface GetScreeningQuestionnaireConfigParams {
  accountId: AccountIds;
}

async function getAllScreeningQuestionnaireConfigs(
  context: IContext,
  params: GetScreeningQuestionnaireConfigParams,
): Promise<Result<ScreeningQuestionnaireConfig[], ErrCode>> {
  const TAG = [...MTAG, 'getAllScreeningQuestionnaireConfigs'];
  const { logger } = context;

  try {
    const calOptimaRiskAssessment = await riskAssessmentConfig(context, params);

    return ok([calOptimaRiskAssessment]);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

async function getScreeningQuestionnaireConfig(
  context: IContext,
  questionnaireType: ScreeningQuestionnaireType,
  params: GetScreeningQuestionnaireConfigParams,
): Promise<Result<ScreeningQuestionnaireConfig, ErrCode>> {
  const TAG = [...MTAG, 'getScreeningQuestionnaireConfig'];
  const { logger } = context;

  try {
    const questionnaireConfigsResult = await getAllScreeningQuestionnaireConfigs(context, params);
    if (questionnaireConfigsResult.isErr()) {
      logger.error(context, TAG, 'error getting all questionnaire configs', { questionnaireType });
      return err(ErrCode.SERVICE);
    }
    const questionnaireConfigs = questionnaireConfigsResult.value;

    const questionnaireConfig = questionnaireConfigs.find((q) => q.questionnaireType === questionnaireType);
    if (!questionnaireConfig) {
      logger.error(context, TAG, 'error finding questionnaire config', { questionnaireType });
      return err(ErrCode.SERVICE);
    }

    return ok(questionnaireConfig);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

type GetChartingV1ConfigParams = {
  appointment: AppointmentRecord;
};

type HistoricalEncounterValue = {
  date: string;
  value: any;
  display: string;
};

export type ChartingV1ConfigResult = {
  config: ChartingV1Config;
  defaultValues: Record<string, string | number>;
  historicalEncounterValues: Record<string, HistoricalEncounterValue[]>;
};

export async function getChartingV1Config(
  context: IContext,
  { appointment }: GetChartingV1ConfigParams,
): Promise<Result<ChartingV1ConfigResult, ErrCode>> {
  const { logger } = context;

  const TAG = [...MTAG, 'getChartingV1Config'];

  try {
    const { patient, providerId } = appointment;

    if (!patient) {
      logger.error(context, TAG, 'trying to get charting config for appointment without patient', { appointment });
      return err(ErrCode.INVALID_DATA);
    }

    let timezone = 'America/Los_Angeles';
    if (providerId) {
      const providerTimezoneResult = await Provider.Service.getProviderTimezone(context, {
        providerId: providerId,
      });

      if (providerTimezoneResult.isErr()) {
        logger.error(context, TAG, 'error getting provider timezone', { error: providerTimezoneResult.error });
        return err(ErrCode.SERVICE);
      }
      timezone = providerTimezoneResult.value.timezone;
    }

    const pastEncountersResult = await getPastFFDEncountersForPatient(context, {
      patientId: patient.patientId,
      limit: 3,
    });

    if (pastEncountersResult.isErr()) {
      logger.error(context, TAG, 'Failed to get past encounters for patient', { error: pastEncountersResult.error });
      return err(ErrCode.SERVICE);
    }

    const historicalRecordsRawData = pastEncountersResult.value.sort(
      (a, b) =>
        DateTime.fromJSDate(new Date(a.encounterDate!)).toMillis() -
        DateTime.fromJSDate(new Date(b.encounterDate!)).toMillis(),
    );

    const config = chartingV1Config(context, {
      patient,
      providerTimezone: timezone,
    });

    const defaultValues = {
      diagnosis_code: 'Z71.3',
    };

    const historicalEncounterValues: Record<string, HistoricalEncounterValue[]> = {};
    historicalRecordsRawData.forEach((encounter) => {
      if (!encounter.rawData) return;

      Object.entries(encounter.rawData).forEach(([key, value]) => {
        const widget = findWidgetInConfig(config, key);
        if (!widget) return;
        if (!isQuestionWidget(widget.widget)) return;

        const displayValue = getQuestionWidgetDisplayValue(context, widget.widget, value);

        const display = (() => {
          if (!displayValue) return '';

          if (displayValue.text && !displayValue.bullets) return displayValue.text;
          if (!displayValue.text && displayValue.bullets) return displayValue.bullets.join('; ');
          if (displayValue.text && displayValue.bullets)
            return `${displayValue.text}: ${displayValue.bullets.join('; ')}`;

          return '';
        })();

        if (historicalEncounterValues[key] == undefined) {
          historicalEncounterValues[key] = [
            {
              value,
              date: encounter.encounterDate!,
              display: display,
            },
          ];
        } else {
          historicalEncounterValues[key].push({
            value,
            date: encounter.encounterDate!,
            display: display,
          });
        }
      });
    });

    return ok({
      config,
      defaultValues,
      historicalEncounterValues,
    });
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

interface ValidateSurveyFormDataProps {
  config: ChartingConfig;
  formData: Record<string, unknown>;
}

export type FormDataError = {
  key: string;
  value: any;
  error: string;
};

type ValidateSurveyFormDataResponse =
  | { success: true; data: Record<string, any> }
  | { success: false; errors: FormDataError[] };

export function validateSurveyFormData(
  context: IContext,
  { config, formData }: ValidateSurveyFormDataProps,
): Result<ValidateSurveyFormDataResponse, ErrCode> {
  const { logger } = context;
  const TAG = [...MTAG, 'validateSurveyFormData'];

  const questionWidgets = config.chartingGroups.groups.flatMap((group) => extractQuestionWidgets(group));
  const data: Record<string, unknown> = {};
  const errors: FormDataError[] = [];
  for (const widget of questionWidgets) {
    const key = widget.key;
    const value = formData[key];
    let schema: z.Schema = getSchemaForWidget(widget);
    if (!schema) {
      logger.error(context, TAG, 'No schema found for widget type', { widget });
      return err(ErrCode.INVALID_DATA);
    }

    if (!('required' in widget) || !widget.required || widget.type === 'conditional-tag-input') {
      schema = schema.nullish().transform((x) => x ?? undefined);
    }

    const result = schema.safeParse(value);
    if (!result.success) {
      errors.push({ key, value, error: result.error.issues[0]?.message });
    } else {
      data[key] = result.data;
    }
  }
  return ok(errors.length > 0 ? { success: false, errors } : { success: true, data });
}

interface GetDisplayFromConfigAndValuesProps {
  config: ChartingV1Config;
  values: Record<string, unknown>;
}

// Map config and completed encounter
// Many widgets can map to the same display format, some are different
export function getDisplayFromConfigAndValues(
  context: IContext,
  { config, values }: GetDisplayFromConfigAndValuesProps,
): QuestionnaireDisplayValue[] {
  const displayValues = config.chartingGroups.groups.reduce((acc, group) => {
    return [...acc, ...convertWidgetGroupToDisplayValues(context, group, values)];
  }, []);

  return displayValues;
}

function getLabel(widget: Widget): string {
  if (widget.type === 'single-checkbox') {
    return widget.checkboxLabel;
  }

  if (widget.type === 'questions-with-date') {
    return widget.question.inputLabel ?? widget.question.label ?? widget.label ?? 'label';
  }

  if ('label' in widget && widget.label) {
    return widget.label;
  }

  if ('inputLabel' in widget && widget.inputLabel) {
    return widget.inputLabel;
  }

  return widget.type;
}

function convertWidgetGroupToDisplayValues(
  context: IContext,
  widget: Widget,
  values: Record<string, unknown>,
): QuestionnaireDisplayValue[] {
  try {
    if (widget.type === 'group') {
      const children = widget.widgets.reduce(
        (acc, w) => [...acc, ...convertWidgetGroupToDisplayValues(context, w, values)],
        [],
      );

      return [
        {
          type: 'group',
          title: widget.title,
          groupKey: widget.groupKey,
          children,
        },
      ];
    }

    if (widget.type === 'conditional') {
      return widget.widgets.reduce((acc, w) => [...acc, ...convertWidgetGroupToDisplayValues(context, w, values)], []);
    }

    if (widget.type === 'flex-row') {
      return widget.widgets.reduce(
        (acc, w) => [...acc, ...convertWidgetGroupToDisplayValues(context, w.widget, values)],
        [],
      );
    }
    if (widget.type === 'tiered-inputs') {
      const schema = questionSchemaMap[widget.type];
      const value = schema.parse(values[widget.key]);

      const displays: (QuestionnaireDisplayValue | null)[] = widget.inputs.map((input) => {
        const found = value[input.key];
        if (!found) return null;
        if (input.type === 'tiered-combobox') {
          const allOptions = input.props.reduce((acc, prop) => {
            return [...acc, ...prop.then.options];
          }, []);
          const foundOption = allOptions.find((o) => o.value === found);
          return {
            type: 'text',
            question: input.inputLabel,
            text: foundOption?.label ?? found,
          };
        }
        if (input.type === 'tiered-textarea') {
          return {
            type: 'text',
            question: input.inputLabel,
            text: found,
          };
        }

        return null;
      });

      return displays.filter((d) => !!d) as QuestionnaireDisplayValue[];
    }

    if (widget.type === 'html' || widget.type === 'data-display' || widget.type === 'alert-box-message') {
      return [];
    }

    if (widget.type === 'inline-inputs') {
      return [];
    }

    if (widget.type === 'grid') {
      return [];
    }
    if (widget.type === 'notice-message') {
      return [];
    }

    const displayValue = getQuestionWidgetDisplayValue(context, widget, values[widget.key]);
    const question = getLabel(widget);

    if (!displayValue) {
      return [];
    }

    return [
      {
        type: 'text',
        question,
        text: displayValue.text,
        bullets: displayValue.bullets,
      },
    ];
  } catch (e) {
    console.error('error converting widget to display value', e);
    return [];
  }
}

function getQuestionWidgetDisplayValue(
  context: IContext,
  widget: QuestionWidget,
  rawValue: unknown,
): null | { text?: string; bullets?: string[] } {
  const { logger } = context;
  const TAG = [...MTAG, 'getQuestionWidgetDisplayValue'];

  try {
    if (widget.type === 'input:text' || widget.type === 'input:textarea' || widget.type === 'input:number') {
      const schema = questionSchemaMap[widget.type].optional().nullable();
      const value = schema.parse(rawValue);

      return {
        text: value ? String(value) : '-',
      };
    }

    if (widget.type === 'tiered-inputs') {
      const schema = questionSchemaMap[widget.type].optional().nullable();
      const value = schema.parse(rawValue);

      if (!value) return { text: '-' };

      let answers: string[] = [];
      widget.inputs.forEach((input) => {
        const key = input.key;
        const found = value[key];

        let foundLabel: string | undefined;
        input.props.forEach((p) => {
          if ('options' in p.then) {
            const op = p.then.options.find((o) => o.value === found);
            if (op) {
              foundLabel = op.label;
            }
          }
        });

        if (found) {
          answers.push(`${input.inputLabel}: ${foundLabel ?? found}`);
        }
      });

      return {
        text: answers.length > 0 ? answers.join(';  ') : '-',
      };
    }

    if (widget.type === 'input:phone') {
      const schema = questionSchemaMap[widget.type].optional().nullable();
      const value = schema.parse(rawValue);

      return {
        text: value ? value : '-',
      };
    }

    if (widget.type === 'single-checkbox') {
      const schema = questionSchemaMap[widget.type].optional().nullable();
      const value = schema.parse(rawValue);
      return {
        text: value ? 'Yes' : 'No',
      };
    }

    if (widget.type === 'input:time') {
      const schema = questionSchemaMap[widget.type].optional().nullable();
      const value = schema.parse(rawValue);

      return {
        text: value ? DateTime.fromFormat(value, 'HH:mm').toFormat('h:mm a') : '-',
      };
    }

    if (widget.type === 'conditional-tag-input') {
      const schema = questionSchemaMap[widget.type].optional().nullable();
      const value = schema.parse(rawValue);

      return {
        text: Array.isArray(value) && value.length > 0 ? 'Yes' : 'No',
        bullets:
          Array.isArray(value) && value.length > 0
            ? value.map((v) => widget.options.find((w) => w.value === v)?.label ?? v)
            : undefined,
      };
    }

    if (widget.type === 'tag-input-v2') {
      const schema = questionSchemaMap[widget.type].optional().nullable();
      const value = schema.parse(rawValue);

      return {
        text: '',
        bullets:
          Array.isArray(value) && value.length > 0
            ? value.map((v) => widget.options.find((w) => w.value === v)?.label ?? v)
            : undefined,
      };
    }

    if (widget.type === 'input:date') {
      const schema = questionSchemaMap[widget.type].optional().nullable();
      const value = schema.parse(rawValue);
      return {
        text: value ? DateTime.fromISO(value).toFormat('LL/dd/yyyy') : '-',
      };
    }

    if (widget.type === 'input:select' || widget.type === 'input:combobox') {
      const schema = questionSchemaMap[widget.type].optional().nullable();
      const value = schema.parse(rawValue);

      const found = widget.options.find((option) =>
        !option.type || option.type === 'basic'
          ? option.value === value
          : option.type === 'group'
            ? option.options.find((o) => o.value === value)
            : false,
      );

      const text = (() => {
        if (!found) return;
        if (found.type === undefined || found.type === 'basic') {
          return found.label;
        }
        if (found.type === 'group') {
          const sub = found.options.find((o) => o.value === value);
          let text = `${found.groupLabel}`;
          if (sub) {
            return `${text}: ${sub.label}`;
          } else {
            return text;
          }
        }
      })();

      return {
        text: text ?? '-',
      };
    }

    if (widget.type === 'input:radio-v2') {
      const schema = questionSchemaMap[widget.type].optional().nullable();
      const value = schema.parse(rawValue);

      const found = widget.options.find((option) =>
        !option.type || option.type === 'basic'
          ? option.value === value
          : option.type === 'combobox'
            ? option.options.find((o) => o.value === value)
            : false,
      );

      if (found?.type === 'combobox') {
        const selectedOption = found.options.find((o) => o.value === value);
        const displayLabel = found.label + ' > ' + (selectedOption?.label ?? '-');
      
        return {
          text: displayLabel,
        };
      }

      return {
        text: found?.label ?? value ?? '-',
      };
    }

    if (widget.type === 'questions-with-date') {
      const schema = questionSchemaMap[widget.type].optional().nullable();
      const value = schema.parse(rawValue);
      return {
        text: value
          ? [value.value, value.date && DateTime.fromISO(value.date).toFormat('LL/dd/yyyy')].filter(Boolean).join(' - ')
          : '-',
      };
    }

    if (widget.type === 'multi-select') {
      const schema = questionSchemaMap[widget.type].optional().nullable();
      const value = schema.parse(rawValue);

      const display = value
        ? Object.entries(value)
            .filter((v) => String(v[1]) === 'true')
            .map((v) => v[0])
            .map((v) => widget.options.find((o) => o.value === v))
            .filter((v) => !!v)
            .map((v) => v?.label)
        : undefined;

      return display ? { bullets: display as string[] } : { text: '-' };
    }

    if (widget.type === 'entry-editor') {
      if (Array.isArray(rawValue) && rawValue.some((v) => v === null)) {
        logger.error(context, TAG, 'Invalid option entry-editor value', { widget: widget.key, rawValue });
        
        // Allow the widget to display remaining options to prevent breaking the Ui
        rawValue = rawValue.filter((v) => v !== null);
      }      
      
      const schema = questionSchemaMap[widget.type].optional().nullable();
      const entries = schema.parse(rawValue);

      const mapped = entries?.map((entry) => widget.options.find((option) => option.value === entry)?.label ?? entry);

      return {
        bullets: mapped,
      };
    }

    if ('key' in widget) {
      return {
        text: rawValue ? JSON.stringify(rawValue) : '-',
      };
    } else {
      return null;
    }
  } catch (e) {
    logger.error(context, TAG, 'Error converting widget and value to display value', { error: e, widget, rawValue });
    return null;
  }
}

interface ValidateSurveyQuestionParams<SchemaType extends keyof typeof questionSchemaMap> {
  value: unknown;
  schemaType: SchemaType;
  nullable?: boolean;
}

export function validateSurveyQuestion<SchemaType extends keyof typeof questionSchemaMap>(
  context: IContext,
  { value, schemaType, nullable }: ValidateSurveyQuestionParams<SchemaType>,
) {
  const { logger } = context;
  const TAG = [...MTAG, 'validateSurveyQuestion'];
  try {
    let schema: z.ZodType = questionSchemaMap[schemaType];
    if (nullable) {
      schema = schema.nullish().transform((x) => x ?? undefined);
    }
    const result = schema.parse(value);

    return ok(result as z.infer<typeof schema>);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export default {
  getScreeningQuestionnairesForAppointment,
  submitScreeningQuestionnaire,
  getChartingV1Config,
  validateSurveyFormData,
  getDisplayFromConfigAndValues,
  validateSurveyQuestion,
};
