import * as _ from "lodash";
import { ok, err, Result } from "neverthrow";
import { IContext } from "@mono/common/lib/context";
import { ErrCode } from "@mono/common/lib/error";
import {
  FederationIdentityRecord,
  FederationSource,
  IdentityRecord,
} from "../../iam/types";

import { getUserScheduleFlow } from "./flows/schedule/user-schedule-flow";
import { Flow } from "./types/flow";
import SchedulingFlow from "../scheduling-flow";
import * as db from "zapatos/db";
import {
  FlowRecord,
  FlowState,
  PaymentRecord,
} from "../scheduling-flow/types";
import { Logger } from "@mono/common";
import { getReferralFlow } from "./flows/schedule/referral-flow";
import { GetAddMeFlowOptions, getAddMeFlow } from "./flows/add-me-flow";
import { getAddPatientFlow } from "./flows/add-patient-flow";
import { UserRecord } from "../../iam/user/store";
import { isFederationIdentity } from "../../iam/identity/service";

import Appointment from "../appointment";
import { AccountIds } from "@mono/common/lib/account/service";
import { getProviderScheduleFlow } from "./flows/provider-schedule-flow";
import {
  GetAuthReferrerFlowOptions,
  getAuthReferrerFlow,
} from "./flows/auth-referrer-flow";
import { createMapAppointmentRecordFn } from "../appointment/store";
import Patient from '../patient';
import Provider from "../provider";
import Consent from '../consent';
import { mapPatientRecord } from "../patient/store";
import Payment from "../payment";
import { InsuranceId } from "../insurance/service";
import { PaymentMethodRecord } from "../payment/store";
import { DateTime } from "luxon";
import { ProviderRecord } from "../provider/shared";
import Experiments from "../experiments";
import { AppointmentType } from "../appointment/types";

const MTAG = Logger.tag();
interface CreateSchedulingFlowParameters {
  context: IContext;
  identity: IdentityRecord;
  user: UserRecord;
  patientId: number;
  referralId?: number;
  defaultPayment?: PaymentRecord;
}

interface CreateSchedulingFlowReturn {
  flow: Flow;
  flowId: number;
  state: FlowState;
}

export async function createSchedulingFlow({
  context,
  identity,
  user,
  patientId,
  defaultPayment,
  referralId,
}: CreateSchedulingFlowParameters): Promise<
  Result<CreateSchedulingFlowReturn, ErrCode>
> {
  const {
    logger,
  } = context;

  const TAG = [ ...MTAG, 'createSchedulingFlow' ]

  try {
    const isOwnerResult = await Patient.Service.isPatientOwner(context, { userId: user.userId, patientId })
    if (isOwnerResult.isErr()) {
      logger.error(context, TAG, 'error')
      return err(ErrCode.AUTHENTICATION)
    }

    const isOwner = isOwnerResult.value
    if (!isOwner) {
      logger.error(
        context,
        TAG,
        "attempt to create flow for patient not owned by user"
      );
      return err(ErrCode.AUTHENTICATION);
    }

    const patientResult = await Patient.Service.getPatientById(context, { patientId })

    if (patientResult.isErr()) {
      return err(patientResult.error)
    }

    const patient = patientResult.value

    if (!patient.identityId) {
      logger.error(context, TAG, 'identity_id must be available to check consent')
      return err(ErrCode.STATE_VIOLATION)
    }

    const hasProviderConsentResult = await Consent.Service.hasValidProviderConsent(context, { identityId: patient.identityId })

    if (hasProviderConsentResult.isErr()) {
      logger.error(context, TAG, 'error fetching provider consent value', { errors: hasProviderConsentResult.error })
      return err(ErrCode.SERVICE)
    }

    const hasScheduleByTimeExperiment = Experiments.patientScheduleByTime(patient)

    const flowResult = await getUserScheduleFlow(context, {
      requireConsent: !hasProviderConsentResult.value,
      isReferral:
        isFederationIdentity(identity) &&
        identity.src == FederationSource.Referral,
      accountId: patient.accountId,
      scheduleByTimeExperiment: hasScheduleByTimeExperiment,
    });

    if (flowResult.isErr()) {
      return err(flowResult.error);
    }

    const flow = flowResult.value

    const apptTypeResult = await Patient.Service.getNextAppointmentType(context, { patientId })
    if (apptTypeResult.isErr()) {
      if (apptTypeResult.error === ErrCode.INITIAL_CHECKIN_REQUIRED) {
        return err(ErrCode.INITIAL_CHECKIN_REQUIRED)
      }
      logger.error(context, TAG, 'error fetching next appt type for scheduling flow', { error: apptTypeResult.error })
      return err(ErrCode.SERVICE)
    }

    const isFollowUp = apptTypeResult.value === AppointmentType.FollowUp

    let defaultPaymentMethod: PaymentMethodRecord | undefined

    // Default payment method represents the default selection from any saved payment methods
    // This is also what is used when a provider schedules an appointment for a patient
    const paymentMethodResult = await Payment.Service.getDefaultPaymentMethod(context, { patientId: patientId })
    if (paymentMethodResult.isOk()) {
      defaultPaymentMethod = paymentMethodResult.value
    } else if (paymentMethodResult.error != ErrCode.NOT_FOUND) {
      logger.error(context, TAG, 'error fetching payment method')
      return err(paymentMethodResult.error)
    }

    // Payment Fields represents the default values to prefill when adding a new payment method
    let paymentFields: Record<string,any> | undefined = defaultPayment
    if (paymentFields === undefined && patient.accountId === AccountIds.CountyCare) {
      paymentFields = {
        method: "plan",
        insurance_id: InsuranceId.CountyCare
      }
    }

    const schedulingFlow = await SchedulingFlow.Service.createFlow(context, {
      identity,
      user,
      patientId,
      initialFlowState: {
        patient_id: patientId,
        ...(defaultPaymentMethod && { payment_method_id: defaultPaymentMethod.id }),
        state: patient.state,
        timezone: patient.timezone,
        ...(patient.firstName && { first_name: patient.firstName }),
        ...(patient.lastName && { last_name: patient.lastName }),
        ...(patient.birthday && { dob: DateTime.fromISO(patient.birthday).toFormat("MM/dd/yyyy") }),
        ...(patient.zipcode && { zipcode: patient.zipcode }),
        is_follow_up: isFollowUp,
        ...(patient.email && { email: patient.email }),
        ...(patient.phone && {
          phone_home: patient.phone,
          phone_mobile: patient.phone,
        }),
        ...(patient.address1 && { address: patient.address1 }),
        ...(patient.address2 && { address2: patient.address2 }),
        ...(patient.city && { address_city: patient.city }),
        ...(patient.state && { address_state: patient.state }),
        ...(patient.zipcode && {
          address_zipcode: patient.zipcode,
        }),
        ...(patient.sex && { sex: patient.sex }),
        ...(referralId && { referral_id: referralId }),
        ...paymentFields,
      },
      flowType: "scheduling_v2",
    });
    if (schedulingFlow.isErr()) {
      logger.error(
        context,
        TAG,
        "error creating scheduling flow record"
      );
      return err(ErrCode.SERVICE);
    }
    return ok({
      flow,
      flowId: schedulingFlow.value.flowId,
      state: schedulingFlow.value.state,
    });
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}


interface GetSchedulingFlowDefaultsParams {
  patientId: number;
  paymentMethod: PaymentMethodRecord;
}

interface SchedulingFlowDefaults {
  appointmentDurations: number[];
  isFollowUp: boolean;
}

async function getSchedulingFlowDefaults(context: IContext, params: GetSchedulingFlowDefaultsParams): Promise<Result<SchedulingFlowDefaults, ErrCode>> {
  const { logger } = context

  const TAG = [ ...MTAG, 'getSchedulingFlowDefaults' ]

  const { patientId, paymentMethod } = params

  const hasScheduledResult = await Patient.Service.hasScheduledAppointment(context, { patientId})
  if (hasScheduledResult.isErr()) {
    logger.error(context, TAG, "error checking patient has scheduled appointment", { error: hasScheduledResult.error })
    return err(hasScheduledResult.error)
  }

  const isFollowUp = hasScheduledResult.value
  const appointmentDurations = Appointment.Service.getAppointmentDurationsForPayment(context, { paymentMethod, isFollowUp })
  return ok({
    appointmentDurations,
    isFollowUp,
  })
}

interface FlowConfigResult {
  flow: Flow;
  initialState: Record<string, string | number | number[]>;
}

type GetReferralFlowConfigOptions = {
  identity: FederationIdentityRecord;
};

export async function getReferralFlowConfig(
  context: IContext,
  options: GetReferralFlowConfigOptions
): Promise<Result<FlowConfigResult, ErrCode>> {
  const { logger } = context;

  try {
    const flowResult = await getReferralFlow(context);

    if (flowResult.isErr()) {
      return err(flowResult.error)
    }

    const flow = flowResult.value

    return ok({
      flow,
      initialState: {
        ...(options.identity.src === FederationSource.Referral
          ? { referral_type: "referrer" }
          : options.identity.src === FederationSource.QcsLead
            ? { referral_type: "qcs" }
            : {}),
      },
    });
  } catch (e) {
    logger.exception(context, "flowV2.service.createReferralFlow", e);
    return err(ErrCode.EXCEPTION);
  }
}

interface GetFlowByIdOptions {
  flowId: number;
  identity: IdentityRecord;
}

export async function getFlowById(
  context: IContext,
  options: GetFlowByIdOptions
): Promise<Result<{ flowRecord: FlowRecord; flowConfig: Flow }, ErrCode>> {
  const TAG = [...MTAG, 'getFlowById']
  const {
    logger,
    store: { reader },
  } = context;

  try {
    const pool = await reader();

    const flowResult = await SchedulingFlow.Store.selectOneFlow(context, {
      flowId: options.flowId,
    });

    if (flowResult.isErr()) {
      logger.error(context, TAG, "flow not found");
      return err(ErrCode.NOT_FOUND);
    }

    const flowRecord = flowResult.value;
    const canUpdateFlow = await SchedulingFlow.Service.canUpdateFlow(
      context,
      options.identity,
      flowRecord
    ); // TODO: ability.can

    if (canUpdateFlow.isErr()) {
      logger.error(
        context,
        TAG,
        "user does not have access to this flow"
      );
      return err(ErrCode.AUTHENTICATION);
    }

    if (flowRecord.patientId === undefined || flowRecord.patientId === null) {
      logger.error(
        context,
        TAG,
        "getting flow by ID assumes schedule_flow already has patientId"
      );
      return err(ErrCode.SERVICE);
    }

    const patientResult = await Patient.Service.getPatientById(context, { patientId: flowRecord.patientId })
    if (patientResult.isErr()) {
      return err(patientResult.error)
    }

    const patient = patientResult.value

    if (flowRecord.flowType !== "scheduling_v2") {
      logger.error(
        context,
        TAG,
        `flow config not found for this flowRecord ${flowRecord}`
      );
      return err(ErrCode.SERVICE);
    }

    if (patient.identityId === undefined) {
      logger.error(context, TAG, 'patient must have identity_id to check provider consent', { patient })
      return err(ErrCode.STATE_VIOLATION)
    }

    const hasProviderConsent = await Consent.Service.hasValidProviderConsent(context, { identityId: patient.identityId });
    if (hasProviderConsent.isErr()) {
      logger.error(context, TAG, 'could not fetch provider consent value')
      return err(ErrCode.SERVICE)
    }

    const hasScheduleByTimeExperiment = Experiments.patientScheduleByTime(patient)

    const flowConfigResult = await getUserScheduleFlow(context, {
      requireConsent: !hasProviderConsent.value,
      accountId: patient.accountId,
      scheduleByTimeExperiment: hasScheduleByTimeExperiment
    })

    if (flowConfigResult.isErr()) {
      return err(flowConfigResult.error);
    }

    const flowConfig = flowConfigResult.value;

    return ok({ flowRecord, flowConfig });
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export async function getAddMeFlowConfig(
  context: IContext,
  user: UserRecord
): Promise<Result<FlowConfigResult, ErrCode>> {
  const { logger } = context;

  try {
    const options: GetAddMeFlowOptions = (() => {
      if (user.accountId === AccountIds.CountyCare) {
        return {
          hideStateQuestion: true,
        };
      }

      return {};
    })();

    const flow = getAddMeFlow(context, options);

    const initialState: Record<string, string | number> = {};

    if (user.phone !== undefined && user.phone !== null) {
      initialState.phoneMobile = user.phone;
    }
    if (user.email !== null && user.email !== undefined) {
      initialState.email = user.email;
    }
    if (user.accountId === AccountIds.CountyCare) {
      initialState.state = "IL";
    }

    return ok({
      flow,
      initialState,
    });
  } catch (e) {
    logger.exception(context, "flowV2.service.getAddMeFlowConfig", e);
    return err(ErrCode.EXCEPTION);
  }
}

export async function getAddPatientFlowConfig(
  context: IContext,
  user: UserRecord
): Promise<Result<FlowConfigResult, ErrCode>> {
  const { logger } = context;

  try {
    // const options: GetAddMeFlowOptions = (() => {
    //   if (user.accountId === COUNTY_CARE_ACCOUNT_ID) {
    //     return {
    //       hideStateQuestion: true,
    //     };
    //   }

    //   return {};
    // })();

    const flow = getAddPatientFlow(context);

    // const initialState: Record<string, string | number> = (() => {
    //   if (user.accountId === COUNTY_CARE_ACCOUNT_ID) {
    //     return {
    //       state: "IL",
    //     };
    //   }

    //   return {} as Record<string, string | number>;
    // })();

    const initialState: Record<string, string | number> = {};

    if (user.phone !== null && user.phone !== undefined) {
      initialState.phoneMobile = user.phone;
    }
    if (user.email !== null && user.email !== undefined) {
      initialState.email = user.email;
    }

    return ok({
      flow,
      initialState,
    });
  } catch (e) {
    logger.exception(context, "flowV2.service.getAddPatientFlowConfig", e);
    return err(ErrCode.EXCEPTION);
  }
}

export async function getAuthReferrerFlowConfig(
  context: IContext,
  options: GetAuthReferrerFlowOptions
): Promise<Result<FlowConfigResult, ErrCode>> {
  const { logger } = context;

  try {
    const flow = getAuthReferrerFlow(context, options);
    const initialState: Record<string, string | number> = {};

    return ok({
      flow,
      initialState,
    });
  } catch (e) {
    logger.exception(context, "flowV2.service.getAuthReferrerFlowConfig", e);
    return err(ErrCode.EXCEPTION);
  }
}

interface GetProviderScheduleFlowConfigOptions {
  provider: ProviderRecord;
  appointmentIds: number[];
  cid: string;
  patientId: number;
  timezone: string;
}

export async function getProviderScheduleFlowConfig(
  context: IContext,
  options: GetProviderScheduleFlowConfigOptions
): Promise<Result<FlowConfigResult, ErrCode>> {
  const TAG = [...MTAG, "getProviderScheduleFlowConfig"];
  const {
    logger,
    config,
    store: { reader },
  } = context;

  try {
    const pool = await reader();

    const patientRecord = await db
      .selectExactlyOne(
        "telenutrition.schedule_patient",
        {
          patient_id: options.patientId,
        },
        {
          lateral: {
            identity: db.selectOne("telenutrition.iam_identity", {
              identity_id: db.parent("identity_id"),
            }),
          },
        }
      )
      .run(pool);

    const patient = mapPatientRecord(patientRecord)

    const appointments = await db.select('telenutrition.schedule_appointment', {
        appointment_id: db.conditions.isIn(options.appointmentIds),
      }, {
        order: { by: 'start_timestamp', direction: 'ASC'}
      })
      .run(pool);

    if (appointments.some((appointment) => appointment.status !== "o")) {
      logger.error(
        context,
        TAG,
        "Cannot start provider scheduling flow for non-open appointment slot.",
        { appointments }
      );
      return err(ErrCode.STATE_VIOLATION);
    }

    const mapAppointmentRecordResult = await createMapAppointmentRecordFn(context);
    if (mapAppointmentRecordResult.isErr()) {
      logger.error(context, TAG, 'could not create mapAppointmentRecordFn', { error: mapAppointmentRecordResult.error })
      return err(ErrCode.SERVICE)
    }

    const mapAppointmentRecord = mapAppointmentRecordResult.value

    const appointmentRecords = appointments.map(appt => mapAppointmentRecord({ record: appt, timezone: options.timezone }))
    const defaultPaymentResult = await Payment.Service.getDefaultPaymentMethod(context, {
      patientId: options.patientId,
      appointment: appointmentRecords[0]
    })
    if (defaultPaymentResult.isErr()) {
      logger.error(context, TAG, "Error getting default payment for patient", { patientId: options.patientId })
      return err(ErrCode.STATE_VIOLATION)
    }

    const paymentMethod = defaultPaymentResult.value

    const canProviderScheduleForPatient =
      await Provider.Service.canProviderScheduleForPatient(context, {
        provider: options.provider,
        patient,
        payment: paymentMethod.payment
      });

    if (canProviderScheduleForPatient.isErr()) {
      logger.error(context, TAG, 'Error determining if provider can schedule for patient', { error: canProviderScheduleForPatient.error })
      return err(ErrCode.SERVICE);
    } else if (canProviderScheduleForPatient.value.canSchedule == false) {
      logger.debug(context, TAG, 'Provider cannot schedule for patient', { patientId: options.patientId, providerId: options.provider.providerId })
      return err(ErrCode.INVALID_DATA);
    }

    const schedulingFlowDefaultsResult = await getSchedulingFlowDefaults(context, {
      patientId: options.patientId,
      paymentMethod
    })
    if (schedulingFlowDefaultsResult.isErr()) {
      logger.error(context, TAG, 'Could not fetch scheduling flow defaults', { error: schedulingFlowDefaultsResult.error })
      return err(ErrCode.SERVICE)
    }
    const { appointmentDurations } = schedulingFlowDefaultsResult.value

    // Filter out the 60 min follow up appointments if patient benefits can only support 30 min follow ups
    const filteredAppointments = appointmentDurations.some(duration => duration === 60) ? appointmentRecords : appointmentRecords.slice(0, 1);    

    const audioFollowUp = 341;
    // TODO: For now, hardcoded list of appointment types to include. Later, the db will save "roles" information
    // which will filter which appointment types should be shown for each role.
    const appointmentTypesResult =
      await Appointment.Service.getAppointmentTypes(context, {
        ids: [
          2, 3, 221, 141, 142, 143, 144, 161, 162, 181, 182, 201, 202, 241, 261,
          262, 302, 321, audioFollowUp
        ],
      });

    if (appointmentTypesResult.isErr()) {
      logger.error(context, TAG, "Cannot fetch appointmentTypes", {
        errors: appointmentTypesResult.error,
      });
      return err(ErrCode.SERVICE);
    }

    const appointmentTypes = appointmentTypesResult.value;

    const flow = getProviderScheduleFlow(context, {
      appointments: filteredAppointments,
      patient,
      appointmentTypes,
      provider: options.provider,
      patientPaymentMethod: paymentMethod,
    });

    const initialState: Record<string, string | number | number[]> = {
      appointment_ids: options.appointmentIds,
      cid: options.cid,
      patient_id: options.patientId,
      provider_name: options.provider.name,
      provider_photo: options.provider.photo,
      provider_initials: options.provider.initials,
    };

    return ok({
      flow,
      initialState,
    });
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export default {
  createSchedulingFlow,
  getFlowById,
  getReferralFlowConfig,
  getAddMeFlowConfig,
  getAddPatientFlowConfig,
  getAuthReferrerFlowConfig,
  getProviderScheduleFlowConfig,
};
