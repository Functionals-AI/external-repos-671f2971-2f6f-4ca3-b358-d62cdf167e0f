import { IContext } from '@mono/common/lib/context';
import { ErrCode, ErrCodeError } from '@mono/common/lib/error';
import { err, ok, Result } from 'neverthrow';
import { Logger } from '@mono/common';
import Store, { mapAppointmentEncounterRecord, mapEncounterAmendmentRecord } from './store';
import { EncounterAmendmentRecord, AmendmentReason, AppointmentEncounterRecord, DRCCategory, EncounterStatus, EncounterOversightStatus } from './shared';
import * as db from 'zapatos/db';
import * as zs from 'zapatos/schema';
import { createMapAppointmentRecordFn } from '../appointment/store';
import { AppointmentRecord } from '../appointment/types';
import Questionnaire from '../questionnaire';
import Appointment from '../appointment';
import { GetAppointmentDetailsResult } from '../appointment/service';
import Provider from '../provider';
import { DateTime } from 'luxon';
import { CompleteAppEncounterData, ExtendedAppEncounterData, HistoricalEncounterData } from './types';
import { FormDataError } from '../questionnaire/service';
import * as _ from 'lodash'
import { IdentityRecord, ProviderIdRecord } from '../../iam/types';
import { isProviderIdentity } from '../../iam/identity/service';
import { getPatientAttributeOptions } from '../../patient-attribute-options';
import { PaymentMethodRecord } from '../payment/store';
import { paymentIsInsurance } from '../scheduling-flow/types';
import { InsuranceId } from '../insurance/service';
import { ProviderRecord } from '../provider/shared';

type AppointmentEncounterChartingData = Record<string, any>;

const MTAG = Logger.tag();

interface CreateAppointmentEncounterParams {
  appointmentId: number;
  chartingData: AppointmentEncounterChartingData;
  identity: ProviderIdRecord;
}

export async function createAppointmentEncounter(
  context: IContext,
  params: CreateAppointmentEncounterParams,
): Promise<Result<{ encounter: AppointmentEncounterRecord; appointment: AppointmentRecord }, ErrCode>> {
  const { logger } = context;
  const TAG = [...MTAG, 'createAppointmentEncounter'];

  try {
    const providerResult = await Provider.Service.getProvider(context, { oktaId: params.identity.fid });

    if (providerResult.isErr()) {
      logger.error(context, TAG, 'Error fetching provider', { oktaId: params.identity.fid });
      return err(ErrCode.SERVICE);
    }

    const provider = providerResult.value;

    const appointmentResult = await Appointment.Service.getAppointment(context, {
      appointmentId: params.appointmentId,
    });

    if (appointmentResult.isErr()) {
      logger.error(context, TAG, 'Failed to fetch appointment', { error: appointmentResult.error });
      return err(ErrCode.SERVICE);
    }

    const appointment = appointmentResult.value;

    if (appointment.providerId !== provider.providerId) {
      logger.error(context, TAG, 'Only the provider who owns this appointment can create an encounter for it', {
        appointmentProviderId: appointment.providerId,
        providerId: provider.providerId,
      });
      return err(ErrCode.FORBIDDEN)
    }

    if (DateTime.fromJSDate(appointment.startTimestamp) > DateTime.now().plus({ days: 1 })) {
      logger.error(context, TAG, 'Cannot create encounter for appointment that tomorrow or later', {
        appointment
      });
      return err(ErrCode.STATE_VIOLATION);
    }

    const configResult = await Questionnaire.Service.getChartingV1Config(context, {
      appointment: appointment,
    });

    if (configResult.isErr()) {
      logger.error(context, TAG, 'Failed to get nutriquiz config', { error: configResult.error });
      return err(ErrCode.SERVICE);
    }

    const appointmentEncounterResult = await Store.createAppointmentEncounter(context, {
      appointmentId: params.appointmentId,
      chartingData: params.chartingData,
      config: configResult.value.config,
    });

    if (appointmentEncounterResult.isErr()) {
      logger.error(context, TAG, 'Failed to create appointment encounter');
      return err(ErrCode.SERVICE);
    }

    const appointmentEncounter = appointmentEncounterResult.value;

    return ok({ appointment: appointmentEncounter.appointment, encounter: appointmentEncounter.encounter });
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

type GetAppointmentEncounterParams = { encounterId: number } | { appointmentId: number };

async function getAppointmentEncounter(
  context: IContext,
  params: GetAppointmentEncounterParams,
): Promise<Result<AppointmentEncounterRecord | null, ErrCode>> {
  const { logger } = context;
  const TAG = [...MTAG, 'getAppointmentEncounter'];

  try {
    const appointmentEncounterResult = await Store.getAppointmentEncounter(context, params);
    if (appointmentEncounterResult.isErr()) {
      logger.error(context, TAG, 'Error fetching appointment encounter');
      return err(ErrCode.SERVICE);
    }

    const encounter = appointmentEncounterResult.value;

    return ok(encounter);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export async function getPastAppEncounters(context: IContext, identityId: number) {
  const { logger } = context;
  const TAG = [...MTAG, 'getPastAppEncounters'];

  try {
    const encountersResult = await Store.getPastAppEncountersForIdentityId(context, identityId);

    if (encountersResult.isErr()) {
      logger.error(context, TAG, 'Failed to get past app encounters', { error: encountersResult.error });
      return err(ErrCode.SERVICE);
    }
    return ok(encountersResult!.value);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

interface SubmitAppointmentEncounterParams {
  encounterId: number;
  identity: IdentityRecord;
  chartingData: AppointmentEncounterChartingData;
}

type ChartingValidationFailureResult = {
  success: false,
  errors: FormDataError[]
}

type SubmitEncounterSuccessResult = {
  success: true,
  appointment: AppointmentRecord,
  appointmentEncounter: AppointmentEncounterRecord
}

type SubmitAppointmentEncounterResult = ChartingValidationFailureResult | SubmitEncounterSuccessResult

type ChartingDataValidationResult = {
  providerTimezone: string;
  provider: ProviderRecord;
  appointment: AppointmentRecord;
  actualStarttime: string;
  actualEndtime: string;
  unitsBilled: number;
  cptCode: string;
  diagnosisCode: string;
}

type ReSubmitEncounterSuccessResult = {
  success: true,
  appointmentEncounter: AppointmentEncounterRecord
}

type ResubmitAppointmentEncounterResult = ChartingValidationFailureResult | ReSubmitEncounterSuccessResult

function isEmpty(data: any) {
  return _.isNil(data) ||
   (_.isString(data) && data.trim().length === 0) ||
   (_.isObject(data) && _.values(data).every(isEmpty))
}

type PatientAttributeOptions = ReturnType<typeof getPatientAttributeOptions>
const DRC_EXCLUDED_MEDICAL_CONDITIONS: (keyof (PatientAttributeOptions['medical_conditions']))[] = [
  'type_1_diabetes',
  'type_2_diabetes',
  'hypertension',
  'high_cholesterol',
  'eating_disorders',
  'crohns_disease',
  'ibs',
  'ulcerative_colitis',
  'gastritis',
  'celiac_disease',
  'congestive_heart_failure',
  'heart_disease',
  'esrd',
  'cancer',
  'pregnancy_induced_hypertension',
  'gestational_diabetes',
  'gerd',
  'obesity',
  'malnutrition',
  'hiv',
  'aids'
]

export async function getDRCCategory(
  context: IContext,
  params: {
    paymentMethod: PaymentMethodRecord
  }
): Promise<Result<DRCCategory | null, ErrCode>> {
  const {
    logger,
    store: { reader },
  } = context;
  const TAG = [...MTAG, 'getDRCCategory']
  const { paymentMethod: { payment, patientId } } = params

  const hasPersonalizedScheduling = paymentIsInsurance(payment) && payment.insurance_id === InsuranceId.CountyCare
  if (!hasPersonalizedScheduling) {
    return ok(null)
  }

  try {
    const pool = await reader();
    const count = await db.count('telenutrition.clinical_encounter', {
      patient_id: patientId,
      encounter_status: EncounterStatus.Closed,
      raw_data: db.conditions.or(
        db.sql`${db.self}->'medical_conditions' ?| array[${db.vals(DRC_EXCLUDED_MEDICAL_CONDITIONS)}]`,
        db.sql`${db.self}->>'inpatient_visit_last_90_days' = ${db.param('inpatient_treatment_last_90_days')}`
      ),
    }).run(pool)
    return ok (count > 0 ? 'excluded' : 'included')
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

async function validateChartingData(
  context: IContext,
  encounterId: number,
  providerId: number,
  chartingData: AppointmentEncounterChartingData,
): Promise<Result<{ success: true; result: ChartingDataValidationResult } | ChartingValidationFailureResult, ErrCode>> {
  const {
    logger,
    store: { reader },
  } = context;
  const TAG = [...MTAG, 'validateChartingData'];

  chartingData = _.transform(
    chartingData,
    (res, v, k) => {
      if (_.isArray(v)) {
        res[k] = v.filter((i) => !isEmpty(i));
      } else if (!isEmpty(v)) {
        res[k] = v;
      }
    },
    {},
  );

  try {
    const pool = await reader();

    const dbEncounter = await db
      .selectOne('telenutrition.clinical_encounter', { encounter_id: encounterId })
      .run(pool);

    if (!dbEncounter) {
      logger.error(context, TAG, 'Encounter not found', { encounterId });
      return err(ErrCode.NOT_FOUND);
    }

    if (dbEncounter.provider_id !== providerId) {
      logger.error(context, TAG, 'Cannot submit an encounter that belongs to another provider', { encounterId });
      return err(ErrCode.FORBIDDEN)
    }

    if (!dbEncounter.appointment_id) {
      logger.error(context, TAG, 'Encounter does not have an appointment_id', { dbEncounter });
      return err(ErrCode.ARGUMENT_ERROR);
    }

    if (
      !(
        dbEncounter.encounter_status == EncounterStatus.Open ||
        (dbEncounter.encounter_status == EncounterStatus.Oversight &&
          dbEncounter.oversight_status == EncounterOversightStatus.ProviderResponseRequired)
      )
    ) {
      logger.error(context, TAG, 'Cannot submit an encounter that is not open or provider_response_required.', { dbEncounter });
      return err(ErrCode.STATE_VIOLATION);
    }

    const getAppointmentResult = await Appointment.Service.getAppointment(context, {
      appointmentId: dbEncounter.appointment_id,
    });

    if (getAppointmentResult.isErr()) {
      logger.error(context, TAG, 'Failed to get appointment', { error: getAppointmentResult.error });
      return err(ErrCode.SERVICE);
    }

    const appointment = getAppointmentResult.value;

    const configResult = await Questionnaire.Service.getChartingV1Config(context, {
      appointment,
    });

    if (configResult.isErr()) {
      return err(ErrCode.SERVICE);
    }

    const config = configResult.value.config;

    const providerResult = await Provider.Service.getProviderByProviderId(context, {
      providerId,
    });

    if (providerResult.isErr()) {
      logger.error(context, TAG, 'Error getting provider', { error: providerResult.error });
      return err(providerResult.error);
    }

    const provider = providerResult.value;

    const providerTimezoneResult = await Provider.Service.getProviderTimezone(context, {
      providerId: provider.providerId,
    });

    if (providerTimezoneResult.isErr()) {
      logger.error(context, TAG, 'Error getting provider timezone', { error: providerTimezoneResult.error });
      return err(providerTimezoneResult.error);
    }

    const { timezone: providerTimezone } = providerTimezoneResult.value;

    const validationResult = Questionnaire.Service.validateSurveyFormData(context, { config, formData: chartingData });

    if (validationResult.isErr()) {
      logger.error(context, TAG, 'Error validating charting data', { chartingData });
      return err(ErrCode.INVALID_DATA);
    }

    if (validationResult.value.success == false) {
      logger.error(context, TAG, 'Invalid charting data', { errors: validationResult.value.errors });
      return ok(validationResult.value);
    }

    const actualStarttimeResult = Questionnaire.Service.validateSurveyQuestion(context, {
      schemaType: 'input:time',
      value: chartingData.start_time,
    });
    const unitsBilledResult = Questionnaire.Service.validateSurveyQuestion(context, {
      value: chartingData.units_billed,
      schemaType: 'input:number',
    });
    const actualEndtimeResult = Questionnaire.Service.validateSurveyQuestion(context, {
      value: chartingData.end_time,
      schemaType: 'input:time',
    });
    const cptCodeResult = Questionnaire.Service.validateSurveyQuestion(context, {
      value: chartingData.cpt_code,
      schemaType: 'input:select',
    });
    const diagnosisCodeResult = Questionnaire.Service.validateSurveyQuestion(context, {
      value: chartingData.diagnosis_code,
      schemaType: 'input:select',
    });

    if (actualStarttimeResult.isErr()) {
      logger.error(context, TAG, 'Invalid start time', { actualStarttimeResult });
      return err(ErrCode.STATE_VIOLATION);
    }
    if (actualEndtimeResult.isErr()) {
      logger.error(context, TAG, 'Invalid end time', { actualEndtimeResult });
      return err(ErrCode.STATE_VIOLATION);
    }
    if (unitsBilledResult.isErr()) {
      logger.error(context, TAG, 'Invalid units billed', { unitsBilledResult });
      return err(ErrCode.STATE_VIOLATION);
    }
    if (cptCodeResult.isErr()) {
      logger.error(context, TAG, 'Invalid cpt code', { cptCodeResult });
      return err(ErrCode.STATE_VIOLATION);
    }
    if (diagnosisCodeResult.isErr()) {
      logger.error(context, TAG, 'Invalid diagnosis code', { diagnosisCodeResult });
      return err(ErrCode.STATE_VIOLATION);
    }

    return ok({
      success: true, 
      result: {
        providerTimezone: providerTimezone,
        provider: provider,
        actualStarttime: actualStarttimeResult.value,
        actualEndtime: actualEndtimeResult.value,
        unitsBilled: unitsBilledResult.value,
        cptCode: cptCodeResult.value,
        diagnosisCode: diagnosisCodeResult.value,
        appointment,
      }
    });
  } catch (e) {
    if (e instanceof ErrCodeError) {
      logger.error(context, TAG, 'Failed to validate appointment encounter');
      return err(e.code);
    }
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export async function submitAppointmentEncounter(
  context: IContext,
  { encounterId, identity, chartingData }: SubmitAppointmentEncounterParams,
): Promise<Result<SubmitAppointmentEncounterResult, ErrCode>> {
  const {
    logger,
    store: { writer },
  } = context;
  const TAG = [...MTAG, 'submitAppointmentEncounter'];

  if (!isProviderIdentity(identity)) {
    logger.error(context, TAG, 'only providers can submit encounters', { encounterId, identity })
    return err(ErrCode.FORBIDDEN)
  }

  const providerResult = await Provider.Service.getProvider(context, { oktaId: identity.fid })
  if (providerResult.isErr()) {
    logger.error(context, TAG, 'Error fetching provider', { oktaId: identity.fid })
    return err(ErrCode.SERVICE)
  }

  const { providerId } = providerResult.value

  try {
    const wPool = await writer();

    const validatedChartingDataResult = await validateChartingData(context, encounterId, providerId, chartingData);
    if (validatedChartingDataResult.isErr()) {
      logger.error(context, TAG, 'Error validating charting', { oktaId: identity.fid })
      return err(ErrCode.SERVICE)
    }

    const validationResult = validatedChartingDataResult.value;

    if (validationResult.success == false) {
      return ok(validationResult);
    } 

    const validatedChartingData = validationResult.result;

    if (!validatedChartingData.appointment.paymentMethodId) {
      logger.error(context, TAG, 'Appointment does not have a payment method', { appointmentId: validatedChartingData.appointment.appointmentId })
      return err(ErrCode.STATE_VIOLATION)
    } 

    const paymentMethodRequiresOversightResult = await doesPaymentMethodRequireOversight(context, validatedChartingData.appointment.paymentMethodId);

    if (paymentMethodRequiresOversightResult.isErr()) {
      logger.error(context, TAG, 'Error checking if ppayer requires oversight', { error: paymentMethodRequiresOversightResult.error });
      return err(ErrCode.SERVICE);
    }

    const paymentMethodRequiresOversight = paymentMethodRequiresOversightResult.value;

    const { appointment: updateAppointment, updateEncounter } = await db.serializable(wPool, async (txn) => {
      const updateEncounterResult = await db
        .update(
          'telenutrition.clinical_encounter',
          {
            raw_data: chartingData,
            encounter_status: paymentMethodRequiresOversight ? EncounterStatus.Oversight : EncounterStatus.Closed,
            oversight_status: paymentMethodRequiresOversight ? EncounterOversightStatus.PendingReview : null,
            actual_starttime: DateTime.fromFormat(validatedChartingData.actualStarttime, 'hh:mm', {
              zone: validatedChartingData.providerTimezone,
            }).toJSDate(),
            actual_endtime: DateTime.fromFormat(validatedChartingData.actualEndtime, 'hh:mm', {
              zone: validatedChartingData.providerTimezone,
            }).toJSDate(),
            units_billed: validatedChartingData.unitsBilled,
            diagnosis_code: validatedChartingData.diagnosisCode,
            billing_code: validatedChartingData.cptCode,
            closed_datetime: new Date(),
            updated_at: new Date(),
            last_modified: new Date(),
            closed_by: validatedChartingData.provider.name,
            billing_tab_reviewed: `${validatedChartingData.provider.name}, ${DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss')}`,
          },
          {
            encounter_id: encounterId,
          },
        )
        .run(txn);

      if (updateEncounterResult.length !== 1) {
        logger.error(context, TAG, 'Expected exactly one encounter updated', { updateEncounterResult });
        throw new ErrCodeError(ErrCode.SERVICE);
      }

      const updateEncounter = updateEncounterResult[0];
      if (!updateEncounter.appointment_id) {
        logger.error(context, TAG, 'Encounter does not have an appointment_id', { updateEncounter });
        throw new ErrCodeError(ErrCode.ARGUMENT_ERROR);
      }

      const updateAppointment = await db
        .update(
          'telenutrition.schedule_appointment',
          { status: '3' },
          {
            appointment_id: updateEncounter.appointment_id,
            status: '2'
          },
        )
        .run(txn);

      if (updateAppointment.length !== 1) {
        logger.error(context, TAG, 'Expected exactly one appointment updated', { updateAppointment });
        throw new ErrCodeError(ErrCode.SERVICE);
      }

      return {
        updateEncounter,
        appointment: updateAppointment[0],
      };
    });

    const mapAppointmentRecordResult = await createMapAppointmentRecordFn(context);

    if (mapAppointmentRecordResult.isErr()) {
      logger.error(context, TAG, 'Failed to map appointment record');
      return err(ErrCode.SERVICE);
    }

    const mapAppointmentRecord = mapAppointmentRecordResult.value;

    return ok({
      success: true,
      appointmentEncounter: mapAppointmentEncounterRecord(updateEncounter),
      appointment: mapAppointmentRecord({
        record: updateAppointment,
        timezone: validatedChartingData.provider.timezone ?? 'US/Pacific',
      }),
    });
  } catch (e) {
    if (e instanceof ErrCodeError) {
      logger.error(context, TAG, 'Failed to submit appointment encounter');
      return err(e.code)
    }
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export async function resubmitAppointmentEncounter(
  context: IContext,
  { encounterId, identity, chartingData }: SubmitAppointmentEncounterParams,
): Promise<Result<ResubmitAppointmentEncounterResult, ErrCode>> {
  const {
    logger,
    store: { writer },
  } = context;
  const TAG = [...MTAG, 'resubmitAppointmentEncounter'];

  if (!isProviderIdentity(identity)) {
    logger.error(context, TAG, 'only providers can resubmit encounters', { encounterId, identity })
    return err(ErrCode.FORBIDDEN)
  }

  const providerResult = await Provider.Service.getProvider(context, { oktaId: identity.fid })
  if (providerResult.isErr()) {
    logger.error(context, TAG, 'Error fetching provider', { oktaId: identity.fid })
    return err(ErrCode.SERVICE)
  }

  const { providerId } = providerResult.value

  try {
    const wPool = await writer();
    const validatedChartingDataResult = await validateChartingData(context, encounterId, providerId, chartingData);
    if (validatedChartingDataResult.isErr()) {
      logger.error(context, TAG, 'Error validating charting', { oktaId: identity.fid })
      return err(ErrCode.SERVICE)
    }

    const validationResult = validatedChartingDataResult.value;

    if (validationResult.success == false) {
      return ok(validationResult);
    } 

    const validatedChartingData = validationResult.result;

    const updateEncounter  = await db.serializable(wPool, async (txn) => {
      const updateEncounterResult = await db
        .update(
          'telenutrition.clinical_encounter',
          {
            raw_data: chartingData,
            encounter_status: EncounterStatus.Oversight,
            oversight_status: EncounterOversightStatus.ProviderChangesMade,
            actual_starttime: DateTime.fromFormat(validatedChartingData.actualStarttime, 'hh:mm', {
              zone: validatedChartingData.providerTimezone,
            }).toJSDate(),
            actual_endtime: DateTime.fromFormat(validatedChartingData.actualEndtime, 'hh:mm', {
              zone: validatedChartingData.providerTimezone,
            }).toJSDate(),
            units_billed: validatedChartingData.unitsBilled,
            diagnosis_code: validatedChartingData.diagnosisCode,
            billing_code: validatedChartingData.cptCode,
            closed_datetime: new Date(),
            updated_at: new Date(),
            last_modified: new Date(),
            closed_by: validatedChartingData.provider.name,
            billing_tab_reviewed: `${validatedChartingData.provider.name}, ${DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss')}`,
          },
          {
            encounter_id: encounterId,
          },
        )
        .run(txn);

      if (updateEncounterResult.length !== 1) {
        logger.error(context, TAG, 'Expected exactly one encounter updated', { updateEncounterResult });
        throw new ErrCodeError(ErrCode.SERVICE);
      }

      const updateEncounter = updateEncounterResult[0];

      return updateEncounter;
    });

    return ok({
      success: true,
      appointmentEncounter: mapAppointmentEncounterRecord(updateEncounter),
    });
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

interface UpdateOversightStatusParams {
  encounterId: number;
  oversightStatus: EncounterOversightStatus;
  oversightBy: string;
  oversightComment: string | null;
}

export async function updateEncounterOversightStatus(
  context: IContext,
  params: UpdateOversightStatusParams,
): Promise<Result<AppointmentEncounterRecord, ErrCode>> {
  const {
    store: { writer },
    logger,
  } = context;

  const TAG = [...MTAG, 'updateEncounterOversightStatus'];

  try {
    const wPool = await writer();
    
    const encounter = await db
      .selectOne('telenutrition.clinical_encounter', {
        encounter_id: params.encounterId,
      })
      .run(wPool);

    if (!encounter) {
      logger.error(context, TAG, 'Encounter not found', { encounterId: params.encounterId });
      return err(ErrCode.NOT_FOUND);
    }

    if (
      !(
        encounter.oversight_status === EncounterOversightStatus.PendingReview ||
        encounter.oversight_status === EncounterOversightStatus.ProviderChangesMade
      )
    ) {
      logger.error(context, TAG, 'Encounter is not in an updateable state.', { encounter });
      return err(ErrCode.STATE_VIOLATION);
    }

    let updatable: zs.telenutrition.clinical_encounter.Updatable = {
      encounter_status: EncounterStatus.Oversight,
      oversight_status: params.oversightStatus,
      oversight_comment: params.oversightComment ?? null,
      oversight_by: params.oversightBy,
      oversight_at: new Date(),
    };

    if ([EncounterOversightStatus.Approved, EncounterOversightStatus.Rejected].includes(params.oversightStatus)) {
      updatable.encounter_status = EncounterStatus.Closed;
    }

    const updatedEncounters = await db
      .update('telenutrition.clinical_encounter', updatable, {
        encounter_id: params.encounterId,
        encounter_status: encounter.encounter_status,
      })
      .run(wPool);

    if (updatedEncounters.length !== 1) {
      logger.error(context, TAG, 'Expected exactly one encounter updated', { updatedEncounters });
      return err(ErrCode.SERVICE);
    }

    return ok(mapAppointmentEncounterRecord(updatedEncounters[0]));
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export async function saveAppointmentEncounterDraft(
  context: IContext,
  params: { chartingData: AppointmentEncounterChartingData; encounterId: number; identity: ProviderIdRecord },
): Promise<Result<AppointmentEncounterRecord, ErrCode>> {
  const {
    store: { writer },
    logger,
  } = context;

  const TAG = [...MTAG, 'saveAppointmentEncounterDraft'];

  try {
    const wPool = await writer();

    const providerResult = await Provider.Service.getProvider(context, { oktaId: params.identity.fid });

    if (providerResult.isErr()) {
      logger.error(context, TAG, 'Error fetching provider', { oktaId: params.identity.fid });
      return err(ErrCode.SERVICE);
    }

    const provider = providerResult.value

    const encounter = await db
      .selectOne('telenutrition.clinical_encounter', {
        encounter_id: params.encounterId,
      })
      .run(wPool);

    if (!encounter) {
      logger.error(context, TAG, 'Encounter not found', { encounterId: params.encounterId });
      return err(ErrCode.NOT_FOUND);
    }

    if (encounter.provider_id !== provider.providerId) {
      logger.error(context, TAG, 'Only the provider who created this encounter can update it', { encounter, providerId: provider.providerId });
      return err(ErrCode.FORBIDDEN)
    }

    if (encounter.encounter_status === 'closed') {
      logger.error(context, TAG, 'Cannot access save functionality on an encounter that is already closed.', {
        encounter,
      });
      return err(ErrCode.STATE_VIOLATION);
    }

    const updateEncounter = await db
      .update(
        'telenutrition.clinical_encounter',
        {
          raw_data: params.chartingData as db.JSONObject,
          last_modified: new Date(),
          updated_at: new Date(),
        },
        {
          encounter_id: params.encounterId,
        },
      )
      .run(wPool);

    if (updateEncounter.length !== 1) {
      logger.error(context, TAG, 'Expected exactly one encounter updated', { updateEncounter });
      return err(ErrCode.SERVICE);
    }

    return ok(mapAppointmentEncounterRecord(updateEncounter[0]));
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

type GetAppointmentEncounterInfoParams = {
  appointmentId: number;
} | {
  encounterId: number;
}

interface AppointmentEncounterInfo {
  appointmentDetails: GetAppointmentDetailsResult;
  encounterData: HistoricalEncounterData | ExtendedAppEncounterData | CompleteAppEncounterData;
}

export async function getAppointmentEncounterInfo(
  context: IContext,
  params: GetAppointmentEncounterInfoParams,
): Promise<Result<AppointmentEncounterInfo, ErrCode>> {
  const { logger } = context;
  const TAG = [...MTAG, 'getAppointmentEncounterInfo'];

  try {
    let appointmentId: number;
    if ('appointmentId' in params) {
      appointmentId = params.appointmentId;
    } else {
      const appointmentEncounterResult = await getAppointmentEncounter(context, { encounterId: params.encounterId });
      if (appointmentEncounterResult.isErr()) {
        logger.error(context, TAG, 'could not get appointment encounter', {
          error: appointmentEncounterResult.error,
        });
        return err(ErrCode.SERVICE);
      }
      if (!appointmentEncounterResult.value) {
        logger.error(context, TAG, 'could not get appointment encounter', {
          error: 'no appointment encounter found',
        });
        return err(ErrCode.SERVICE);
      }

      const apptId = appointmentEncounterResult.value.appointmentId;

      if (!apptId) {
        logger.error(context, TAG, 'could not get appointment encounter', {
          error: 'no appointment encounter found',
        });
        return err(ErrCode.SERVICE);
      }

      appointmentId = apptId;
    }

    const appointmentDetailResult = await Appointment.Service.getAppointmentDetails(context, {
      appointmentId,
      nutriquiz: true,
    });

    if (appointmentDetailResult.isErr()) {
      logger.error(context, TAG, 'could not get appointment details', {
        appointmentId,
        error: appointmentDetailResult.error,
      });
      return err(ErrCode.SERVICE);
    }

    const appointmentDetails = appointmentDetailResult.value;
    if (appointmentDetails.appointment.patientId === undefined) {
      logger.error(context, TAG, 'Appointment not associated with patient', {
        appointmentId,
      });
      return err(ErrCode.STATE_VIOLATION)
    }

    let encounter: null | AppointmentEncounterRecord = null;
    if (['1', '2', '3', '4'].includes(appointmentDetails.appointment.status)) {
      const encounterResult = await getAppointmentEncounter(context, { appointmentId });
      if (encounterResult.isErr()) {
        logger.error(context, TAG, 'could not get encounter for appointment', {
          appointmentId,
          error: encounterResult.error,
        });
        return err(ErrCode.SERVICE);
      }

      encounter = encounterResult.value;
    }

    if (encounter?.type === 'historical') {
      return ok({
        appointmentDetails,
        encounterData: {
          type: 'historical',
          historicalEncounter: encounter as HistoricalEncounterData['historicalEncounter'],
        },
      });
    }

    const configResult = await Questionnaire.Service.getChartingV1Config(context, {
      appointment: appointmentDetails.appointment,
    });

    if (configResult.isErr()) {
      logger.error(context, TAG, 'Failed to get charting config', { error: configResult.error });
      return err(ErrCode.SERVICE);
    }

    const chartingConfig = configResult.value;

    if (!appointmentDetails.appointment.paymentMethodId) {
      logger.error(context, TAG, 'Appointment does not have a payment method', { appointmentId: appointmentDetails.appointment.appointmentId })
      return err(ErrCode.STATE_VIOLATION)
    } 

    const paymentMethodRequiresOversightResult = await doesPaymentMethodRequireOversight(context, appointmentDetails.appointment.paymentMethodId);

    if (paymentMethodRequiresOversightResult.isErr()) {
      logger.error(context, TAG, 'Error checking if payer requires oversight', { error: paymentMethodRequiresOversightResult.error });
      return err(ErrCode.SERVICE);
    }

    const paymentMethodRequiresOversight = paymentMethodRequiresOversightResult.value;

    const questionnairesResult = await Questionnaire.Service.getScreeningQuestionnairesForAppointment(context, {
      appointmentId,
      experimental: true,
    });
    if (questionnairesResult.isErr()) {
      logger.error(context, TAG, 'could not get questionnaires for provider appointment detail', {
        appointmentId,
        error: questionnairesResult.error,
      });
      return err(ErrCode.SERVICE);
    }
    const questionnaires = questionnairesResult.value;

    if (!encounter) {
      return ok({
        appointmentDetails,
        questionnaires,
        encounterData: {
          type: 'app',
          encounter: null,
          chartingConfig,
          oversightRequired: paymentMethodRequiresOversight,
        },
      });
    }

    if (
      encounter.encounterStatus === EncounterStatus.Open ||
      (encounter.encounterStatus === EncounterStatus.Oversight &&
        encounter.oversightStatus === EncounterOversightStatus.ProviderResponseRequired)
    ) {
      return ok({
        appointmentDetails,
        questionnaires,
        encounterData: {
          type: 'app',
          encounter,
          chartingConfig,
          oversightRequired: paymentMethodRequiresOversight,
        },
      });
    }

    if (!encounter.rawData) {
      return ok({
        appointmentDetails,
        questionnaires,
        encounterData: {
          type: 'app-complete',
          encounter,
        },
      });
    }

    const displayChartingData = Questionnaire.Service.getDisplayFromConfigAndValues(context, {
      values: encounter.rawData,
      config: chartingConfig.config,
    });

    return ok({
      appointmentDetails,
      questionnaires,
      encounterData: {
        type: 'app-complete',
        encounter,
        displayChartingData,
      },
    });
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

async function doesPaymentMethodRequireOversight(
  context: IContext,
  paymentMethodId: number,
): Promise<Result<boolean, ErrCode>> {
  const { logger, store: { reader } } = context;

  const TAG = [...MTAG, 'doesEncounterNeedMdReview'];

  try {
    const pool = await reader()

    const patientPaymentMethod = await db.selectOne('telenutrition.schedule_patient_payment_method', { 
      payment_method_id: paymentMethodId,
    }, {
      lateral: {
        payment_method_type: db.selectOne('telenutrition.payment_method_type', {
          payment_method_type_id: db.parent('payment_method_type_id'),
        }, {
          lateral: {
            payer: db.selectOne('telenutrition.payer', {
              payer_id: db.parent('payer_id')
            })
          }
        })
      }
    }).run(pool)

    return ok(patientPaymentMethod?.payment_method_type?.payer?.oversight_required ?? false)
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

type SubmitEncounterAmendmentRequestParams = {
  encounterId: number;
  providerId: number;
  identity: ProviderIdRecord;
  data: {
    unitsBilled?: number;
    cptCode?: string;
    reason: AmendmentReason;
    comments?: string;
  };
}

async function createEncounterAmendmentRequest(
  context: IContext,
  { encounterId, providerId, data, identity }: SubmitEncounterAmendmentRequestParams
): Promise<Result<number, ErrCode>> {
  const { logger } = context;
  const TAG = [...MTAG, 'createEncounterAmendmentRequest'];

  try {
    const encounterResult = await Store.getAppointmentEncounter(context, { encounterId })
    if (encounterResult.isErr()) {
      logger.error(context, TAG, 'Error getting encounter', {
        encounterId,
        error: encounterResult.error
      })
      return err(encounterResult.error)
    }

    const encounter = encounterResult.value

    if (encounter?.providerId !== providerId) {
      logger.error(context, TAG, 'Attempt to create encounter amendment by a different providerId', {
        encounterId,
        providerId,
        encounterProviderId: encounter?.providerId,
      })
      return err(ErrCode.FORBIDDEN)
    }

    if (encounter?.encounterStatus !== 'closed') {
      logger.error(context, TAG, 'Attempt to create encounter amendment for an encounter that is not closed', {
        encounterId
      })
      return err(ErrCode.STATE_VIOLATION)
    }

    const createAmendmentResult = await Store.createAppointmentEncounterAmendment(context, {
      encounterId,
      ...data
    })

    if (createAmendmentResult.isErr()) {
      logger.error(context, TAG, 'Error creating encounter amendment', {
        encounterId,
        error: createAmendmentResult.error
      })
      return err(ErrCode.SERVICE)
    }

    return ok(createAmendmentResult.value)
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export async function getEncounterAmendments(context: IContext, encounterId: number): Promise<Result<EncounterAmendmentRecord[], ErrCode>> {
  const {store: { reader }, logger} = context
  const TAG = [...MTAG, 'getEncounterAmendments'];

  try {
    const pool = await reader()
    const amendments = await db.select('telenutrition.clinical_encounter_amendment', {
      encounter_id: encounterId,
    }, {
      order: { by: 'created_at', direction: 'DESC' }
    }).run(pool)

    return ok(amendments.map(mapEncounterAmendmentRecord))
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

type ResolveEncounterAmendmentParams = {
  amendmentId: number,
  status: 'approved' | 'rejected',
  resolvedBy: string
}

async function resolveEncounterAmendment(
  context: IContext,
  { amendmentId, status, resolvedBy } : ResolveEncounterAmendmentParams
): Promise<Result<boolean, ErrCode>> {
  const {
    logger,
    store: { writer },
  } = context;
  const TAG = [...MTAG, 'resolveEncounterAmendment'];

  try {
    const pool = await writer();

    const result = await db.serializable(pool, async (txn) => {
      const record = await db.selectOne('telenutrition.clinical_encounter_amendment', {
        amendment_id: amendmentId
      }).run(txn)

      if (!record) {
        logger.error(context, TAG, 'Amendment not found', { amendmentId })
        throw new ErrCodeError(ErrCode.NOT_FOUND)
      }

      if (record.status !== 'pending') {
        logger.error(context, TAG, 'Amendment not in pending state', { amendmentId })
        throw new ErrCodeError(ErrCode.STATE_VIOLATION)
      }

      const results = await Promise.all([
        ...(status === 'approved' ? [
          db.update('telenutrition.clinical_encounter', {
            units_billed: record.units_billed,
            billing_code: record.billing_code,
            raw_data: db.sql`${db.self} || ${db.param({
              ...(record.billing_code && { cpt_code: record.billing_code.toString() }),
              ...(record.units_billed && { units_billed: record.units_billed.toString() })
            }, 'jsonb')}`,
            updated_at: new Date(),
          }, {
            encounter_id: record.encounter_id
          }).run(txn)
        ] : []),
        db.update('telenutrition.clinical_encounter_amendment', {
          status: status,
          resolved_by: resolvedBy,
          resolved_at: db.sql`now()`,
        }, {
          amendment_id: amendmentId
        }).run(txn)
      ])

      return results.every(result => result.length > 0)
    })

    return ok(result);
  } catch(e) {
    logger.exception(context, TAG, e);
    if (e instanceof ErrCodeError) {
      return err(e.code)
    }
    return err(ErrCode.EXCEPTION);
  }
}

async function updateEncounterVisitTimes(
  context: IContext,
  params: { encounterId: number; startTimestamp?: Date; endTimestamp?: Date },
): Promise<Result<number, ErrCode>> {
  const {logger,store: { writer }} = context;

  const TAG = [...MTAG, 'updateEncounterVisitTimes'];

  try {
    const pool = await writer();
    const encounter = await db.selectOne('telenutrition.clinical_encounter', {
      encounter_id: params.encounterId,
    })
    .run(pool);

    if (!encounter) {
      logger.error(context, TAG, 'Encounter not found', { encounterId: params.encounterId });
      return err(ErrCode.NOT_FOUND);
    }

    if (encounter.encounter_status === 'closed') {
      logger.error(context, TAG, 'Cannot update visit times on a closed encounter', { encounter });
      return err(ErrCode.STATE_VIOLATION);
    }
    if (params.endTimestamp && encounter.timer_ended_at) {
      logger.error(context, TAG, 'Record already has end timestamp', { encounter });
      return err(ErrCode.STATE_VIOLATION);
    }
    if (params.startTimestamp && encounter.timer_started_at) {
      logger.error(context, TAG, 'Record already has start timestamp', { encounter });
      return err(ErrCode.STATE_VIOLATION);
    }

    const updateObject = {
      ...(params.startTimestamp && { timer_started_at: params.startTimestamp }),
      ...(params.endTimestamp && { timer_ended_at: params.endTimestamp }),
    };
    const updateResult = await db.update('telenutrition.clinical_encounter', updateObject, {
      encounter_id: params.encounterId,
    }).run(pool);

    logger.debug(context, TAG, 'Updated encounter visit times', { updateObject, updateResult });

    return ok(updateResult.length);
  } catch (error) {
    logger.exception(context, TAG, error);
    return err(ErrCode.EXCEPTION);
  }
}

export default {
  createAppointmentEncounter,
  submitAppointmentEncounter,
  saveAppointmentEncounterDraft,
  getAppointmentEncounterInfo,
  getPastAppEncounters,
  createEncounterAmendmentRequest,
  getEncounterAmendments,
  resolveEncounterAmendment,
  updateEncounterVisitTimes,
  getDRCCategory,
  updateEncounterOversightStatus,
  resubmitAppointmentEncounter,
};
