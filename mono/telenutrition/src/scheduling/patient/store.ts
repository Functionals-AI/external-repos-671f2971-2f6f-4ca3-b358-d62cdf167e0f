import { err, ok, Result } from "neverthrow"
import * as db from 'zapatos/db'
import '@mono/common/lib/zapatos/schema'
import * as zs from 'zapatos/schema'
import { phone } from 'phone'

import { ErrCode, ErrCodeError } from "@mono/common/lib/error"
import { IContext } from "@mono/common/lib/context"
import { mapPatientRecord, PatientRecord } from './patient-record'
import _ = require("lodash")
import { lookupDepartment } from "../service"
import { selectIdentity } from "../../iam/identity/store"

export { mapPatientRecord, PatientRecord }

const MTAG = [ 'telenutrition', 'scheduling', 'patient', 'store' ]

export function getNextAndLastSessions(sessions: string[]) {
  let st = 0, ed = sessions.length;
  const now = new Date();
  while (st < ed) {
    const mid = Math.floor((st + ed) / 2);
    if (new Date(sessions[mid]) < now)
      st = mid + 1;
    else
      ed = mid;
  }
  const lastSession = st !== 0 ? sessions[st - 1] : undefined;
  const nextSession = st !== sessions.length ? sessions[st] : undefined;
  return {
    lastSession,
    nextSession,
  }
}

export type SelectOnePatientByIdOption = { patientId: number }
export type SelectOnePatientByIdentityIdOption = { identityId: number }

export type SelectOnePatientOptions = SelectOnePatientByIdOption | SelectOnePatientByIdentityIdOption

/**
 * Select a patient where a patient can be uniquely identified by passed in options.
 
 * @param context Select a patient where a patient can be uniquely identified by passed in options
 * @param options 
 */
export async function selectOnePatient(context: IContext, options: SelectOnePatientOptions): Promise<Result<PatientRecord, ErrCode>> {
  const { logger, store: { reader }} = context
  const TAG = [ ...MTAG, 'selectOnePatient' ]

  try {
    const pool = await reader()
    const whereable = (options as SelectOnePatientByIdOption).patientId ? {
        patient_id: (options as SelectOnePatientByIdOption).patientId
      } : {
        identity_id: (options as SelectOnePatientByIdentityIdOption).identityId
      }

    const record = await db.selectOne('telenutrition.schedule_patient', whereable, {
      lateral: {
        identity: db.selectOne('telenutrition.iam_identity', {
          identity_id: db.parent('identity_id')
        }),
        userPatient: db.selectOne('telenutrition.schedule_user_patient', {
          patient_id: db.parent('patient_id'),
        }, {
          lateral: {
            user: db.selectOne('telenutrition.iam_user', {
              user_id: db.parent('user_id'),
            })
          }
        })
      }
    }).run(pool)

    if (record === undefined) {
      logger.error(context, TAG, 'Patient not found.', {
        options
      })

      return err(ErrCode.NOT_FOUND)
    }

    return ok(mapPatientRecord(record))
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export async function selectOnePatientByPhoneNumber(context: IContext, phoneNumber: string): Promise<Result<PatientRecord, ErrCode>> {
  const { logger, store: { reader }} = context
  const TAG = [ ...MTAG, 'selectOnePatientByPhoneNumber' ]

  try {
    const pool = await reader()
    const validation = phone(phoneNumber, { country: 'USA', validateMobilePrefix: false })

    if (!validation.isValid) {
      logger.error(context, TAG, 'Phone number is not valid.', {
        phoneNumber
      })

      return err(ErrCode.INVALID_DATA)
    }

    const normalizedPhoneNumber = validation.phoneNumber

    try {
      const record = await db.selectExactlyOne('telenutrition.schedule_patient', {
        phone: normalizedPhoneNumber,
      }, {
        lateral: {
          identity: db.selectOne('telenutrition.iam_identity', {
            identity_id: db.parent('identity_id')
          })
        }
      }).run(pool)

      return ok(mapPatientRecord(record))
    }
    catch (e) {
      logger.error(context, TAG, 'Patient cannot be uniquely selected using phone number.', {
        phoneNumber
      })

      return err(ErrCode.EXCEPTION)
    }
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export async function selectPatientsByPhoneNumber(context: IContext, phoneNumber: string): Promise<Result<PatientRecord[],ErrCode>> {
  const { logger, store: { reader }} = context
  const TAG = [ ...MTAG, 'selectAllPatientsByPhoneNumber' ]

  try {
    const pool = await reader()
    const validation = phone(phoneNumber, { country: 'USA', validateMobilePrefix: false })

    if (!validation.isValid) {
      logger.error(context, TAG, 'Phone number is not valid.', {
        phoneNumber
      })

      return err(ErrCode.INVALID_DATA)
    }

    const normalizedPhoneNumber = validation.phoneNumber

    try {
      const records = await db.select('telenutrition.schedule_patient', {
        phone: normalizedPhoneNumber,
      }, {
        lateral: {
          identity: db.selectOne('telenutrition.iam_identity', {
            identity_id: db.parent('identity_id')
          })
        }
      }).run(pool)

      const results = records.map(record => mapPatientRecord(record))
      return ok(results)
    }
    catch (e) {
      logger.error(context, TAG, 'Patient cannot be uniquely selected using phone number.', {
        phoneNumber
      })

      return err(ErrCode.EXCEPTION)
    }
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}


export async function selectPatientsById(context: IContext, patientIds: number[]): Promise<Result<PatientRecord[],ErrCode>> {
  const { logger, store: { reader }} = context
  const TAG = [ ...MTAG, 'selectPatientsById' ]

  if (patientIds.length == 0) {
    return ok([])
  }

  try {
    const pool = await reader()
    const records = await db.select('telenutrition.schedule_patient', {
      patient_id: db.conditions.isIn(patientIds),
    }, {
      lateral: {
        identity: db.selectOne('telenutrition.iam_identity', {
          identity_id: db.parent('identity_id')
        })
      }
    }).run(pool)

    const results = records.map(record => mapPatientRecord(record))
    return ok(results)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function fetchPatientsForUser(context: IContext, userId: number): Promise<Result<PatientRecord[], ErrCode>> {
  const { logger, store: { reader } } = context

  try {
    const pool = await reader()
    const records = await db.select('telenutrition.schedule_user_patient', {
      user_id: userId
    }, {
      lateral: {
        patients: db.select('telenutrition.schedule_patient', {
          patient_id: db.parent('patient_id')
        }, {
          lateral: {
            identity: db.selectOne('telenutrition.iam_identity', {
              identity_id: db.parent('identity_id')
            })
          }
        })
      }
    }).run(pool)

    const patients = records.flatMap(record => record.patients.map(mapPatientRecord))
    return ok(patients)
  } catch (e) {
    logger.exception(context, 'service.getUserPatients', e)
    return err(ErrCode.EXCEPTION)
  }
}

export interface PatientContactInfo {
  email?: string,
  phone?: string,
}

export async function updatePatientContactInfo(context: IContext, patientId: number, contactInfo: PatientContactInfo): Promise<Result<PatientRecord, ErrCode>> {
  const { logger, store: { writer } } = context
  const TAG = [ ...MTAG, 'updatePatientContactInfo' ]

  try {
    const pool = await writer()

    if (contactInfo.email || contactInfo.phone) {
      const updates = { ...contactInfo }

      if (contactInfo.phone) {
        const validation = phone(contactInfo.phone, { country: 'USA', validateMobilePrefix: false })

        if (!validation.isValid) {
          logger.error(context, TAG, 'Phone number is not valid.', {
            contactInfo,
          })
  
          return err(ErrCode.INVALID_DATA)
        }
  
        updates.phone = validation.phoneNumber
      }

      const records = await db.update('telenutrition.schedule_patient', 
        updates,
        {
          patient_id: patientId
        }
      ).run(pool)

      if (records.length !== 1) {
        logger.error(context, TAG, 'Patient not found on update.', {
          patientId,
          contactInfo,
        })

        return err(ErrCode.NOT_FOUND)
      }
    }

    const selectPatientResult = await selectOnePatient(context, { patientId, })

    if (selectPatientResult.isErr()) {
      logger.error(context, TAG, 'Error selecting patient.', {
        patientId,
      })

      return err(selectPatientResult.error)
    }

    return ok(selectPatientResult.value)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export type UpdatePatientPayload =
  Omit<PatientRecord, "patientId" | "departmentId" | "timezone" | "phone" | "email"> &
  { phone?: string | null; email?: string | null; } &
  Partial<Pick<PatientRecord, "timezone">>

export async function updatePatientInfo(context: IContext, patientId: number, patient: UpdatePatientPayload): Promise<Result<PatientRecord, ErrCode>> {
  const { logger, store: { writer } } = context
  const TAG = [ ...MTAG, 'updatePatientInfo' ]

  try {
    const oldPatientResult = await selectOnePatient(context, { patientId })
    if (oldPatientResult.isErr()) {
      logger.error(context, TAG, 'Error selecting patient.', {
        patientId,
      })

      return err(oldPatientResult.error)
    }
    const oldPatient = oldPatientResult.value

    let timezone = patient.timezone
    let departmentId: number | undefined
    if (oldPatient.state !== patient.state) {
      const deptResult = await lookupDepartment(context, {state: patient.state})
      if (deptResult.isErr()) {
        logger.error(context, TAG, `failed to lookup department for patient`, {state: patient.state})
        return err(deptResult.error)
      }
      const dept = deptResult.value
      departmentId = dept.departmentId
      if (!timezone) {
        timezone = dept.timezone
      }
    }

    // Determine the identity attributes as they would be after an update
    const { firstName, lastName, zipcode, birthday } = {
      ...oldPatient,
      ...patient
    }
    if (!firstName || !lastName || !zipcode || !birthday) {
      logger.error(context, TAG, 'attempt to update patient with partial identity', { patientId })
      return err(ErrCode.INVALID_DATA)
    }
    const isIdentityUpdate = oldPatient.firstName != firstName
        || oldPatient.lastName != lastName
        || oldPatient.zipcode != zipcode
        || oldPatient.birthday != birthday;

    const wPool = await writer()
    await db.serializable(wPool, async txn => {

      if (isIdentityUpdate) {
        const selectIdentityResult = await selectIdentity(context, { 
          firstName: firstName, 
          lastName: lastName, 
          zipCode: zipcode, 
          birthday: new Date(birthday),
        }, txn);

        if (selectIdentityResult.isOk()) {
          const selectedIdentity = selectIdentityResult.value

          // If updating the identity attributes would conflict with an existing
          // identity, throw a state violation (for now)
          // If needed, we could allow the patient to update their identity to
          // match the existing identity if it is unused, but we would need
          // to go through the verification steps first
          if (selectedIdentity.identityId != oldPatient.identityId) {
            logger.warn(context, TAG, "identity conflict during update provider patient", { 
              patientId,
              oldPatientIdentityId: oldPatient.identityId,
              selectedIdentityId: selectedIdentity.identityId
            })
            throw new ErrCodeError(ErrCode.STATE_VIOLATION)
          }
        } else if (selectIdentityResult.error != ErrCode.NOT_FOUND) {
          logger.error(context, TAG, "Error selecting identity")
          throw new ErrCodeError(selectIdentityResult.error)
        }
      }

      const patientRecords = await db.update("telenutrition.schedule_patient", {
        state: patient.state,
        address: patient.address1,
        address2: patient.address2,
        city: patient.city,
        sex: patient.sex,
        phone: patient.phone,
        email: patient.email,
        preferred_name: patient.preferredName,
        pronouns: patient.pronouns,
        language: patient.language,
        religion: patient.religion,
        ...(departmentId && { department_id: departmentId }),
        ...(timezone && { timezone })
      }, {
        patient_id: patientId
      }).run(txn)

      if (patientRecords.length !== 1) {
        logger.error(context, TAG, 'Patient not found on update.', {
          patientId,
          patient
        })
        throw new ErrCodeError(ErrCode.NOT_FOUND)
      }
      
      const identityRecords = await db.update("telenutrition.iam_identity", {
        first_name: patient.firstName,
        last_name: patient.lastName,
        birthday: patient.birthday,
        zip_code: patient.zipcode,
      }, {
        identity_id: oldPatient.identityId
      }).run(txn)

      if (identityRecords.length !== 1) {
        logger.error(context, TAG, 'Identity not found on update.', {
          patientId,
          patient
        })
        throw new ErrCodeError(ErrCode.NOT_FOUND)
      }
    });

    const updatedPatientResult = await selectOnePatient(context, { patientId })
    if (updatedPatientResult.isErr()) {
      logger.error(context, TAG, 'Error selecting patient.', {
        patientId,
      })

      return err(updatedPatientResult.error)
    }

    return ok(updatedPatientResult.value);
  }
  catch (e) {
    logger.exception(context, TAG, e)
    return err(e instanceof ErrCodeError ? e.code : ErrCode.EXCEPTION)
  }
}

interface GetSessionTimestampsForPatientsParams {
  patientIds: number[]
}

type AppointmentTimestamps = Pick<zs.telenutrition.schedule_appointment.JSONSelectable, 'start_timestamp' | 'patient_id'>[]
type PatientAppointmentTimestampsMap = Record<string, AppointmentTimestamps>

export async function getAllActiveAppointmentsForPatients(context: IContext, params: GetSessionTimestampsForPatientsParams): Promise<Result<PatientAppointmentTimestampsMap, ErrCode>> {
  const { store: { reader }, logger } = context

  const TAG = [...MTAG, 'getAllActiveAppointmentsForPatients']
  
  try {
    const pool = await reader()
    const appointments = await db.select('telenutrition.schedule_appointment', {
      status: db.conditions.isNotIn(['x']),
      frozen: false,
      patient_id: db.conditions.isIn(params.patientIds)
    }, {
      distinct: ['start_timestamp'],
      columns: ['start_timestamp', 'patient_id'],
      order: { by: 'start_timestamp', direction: 'ASC' },
    }).run(pool)

    const map: PatientAppointmentTimestampsMap = {};
    const appts = _.groupBy(appointments, appt => appt.patient_id)
    for (const patientId of params.patientIds) {
      map[patientId] = appts[patientId] ?? []
    }

    return ok(map)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export type PatientWithIdentity = zs.telenutrition.schedule_patient.JSONSelectable & {
  identity?: zs.telenutrition.iam_identity.JSONSelectable;
}

export default {
  selectOnePatient,
  selectOnePatientByPhoneNumber,
  selectPatientsByPhoneNumber,
  selectPatientsById,
  fetchPatientsForUser,
  updatePatientContactInfo,
  updatePatientInfo,
  getAllActiveAppointmentsForPatients,
}