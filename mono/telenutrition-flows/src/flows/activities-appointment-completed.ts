/**
 * Extract new appointments which have been completed and generate activities in the DB.
 */
import { Result, ok, err } from 'neverthrow'
import { DateTime } from 'luxon'

import { ErrCode } from '@mono/common/lib/error'
import { JsonObject, choice, succeed, task, workflow } from '@mono/common-flows/lib/builder'
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'
import Sync from '@mono/common-flows/lib/tasks/sync'
import { ActivityTypeIds, AppointmentCompletedUserActivityRecord, createUserActivity } from '@mono/telenutrition/lib/activity/service'
import { publishUserActivitiesCreatedEvent } from '@mono/telenutrition/lib/activity/events'

const MTAG = [ 'telenutrition-flows', 'activities-appointment-completed' ]

const SYNC_TOKEN_NAME = 'telenutrition-flows.activities-appt-completed'
const DIFF_TABLE_BASENAME = 'activities_appointment_completed'

enum State {
  InitInput = 'InitInput',
  GetToken = 'GetToken',
  WarehouseQuery = 'WarehouseQuery',
  CreateActivities = 'CreateActivities',
  BranchOnCreateActivities = 'BranchOnCreateActivities',
  UpdateToken = 'UpdateToken',
  EmitEvent = 'EmitEvent',
  Success = 'Success',
}

type CompletedAppointment = {
  userId: number;
  userIdentityId: number;
  patientId: number;
  patientIdentityId: number;
  appointmentId: number;
  appointmentTypeId: number;
  appointmentStatus: string;
  appointmentDate: string;
  appointmentStartTime: string;
  appointmentDuration: number;
  appointmentTimezone: string;
}

type AppointmentCompletedUserActivityRecordJSON = Omit<
  AppointmentCompletedUserActivityRecord,
  'appointmentStartAt' |
  'createdAt'
> & {
  appointmentStartAt: string,
  createdAt: string
}

/**
 * Apply following transforms S.T. date / time values are normalized and object
 * is JSON serializable (no dates):
 * 
 *  - appointmentStatus: Just take first character.
 *  - apppointmentDate: Date's in Redshift are YYYY-MM-DD, transform to 
 *    MM/DD/YYYY which is how date strings are stored in Postgres.
 *  - appointmentStartTime: Stored in Redshift as HH:mm A, transform to
 *    HH:mm.
 * 
 * @param row - Row of data as returned from DBs.
 * @returns 
 */
function rowToCompletedAppointment(row): Result<CompletedAppointment, ErrCode> {
  try {
    const startAt = DateTime.fromFormat(`${DateTime.fromFormat(row.appointment_date, 'MM/dd/yyyy').toFormat('yyyy-MM-dd')} ${row.appointment_start_time}`, 'yyyy-MM-dd HH:mm', {
      zone: row.department_timezone
    })

    const completedAppointment = {
      userId: row.user_id,
      userIdentityId: row.user_identity_id,
      patientId: Number(row.patient_id),
      patientIdentityId: row.patient_identity_id,
      appointmentId: Number(row.appointment_id),
      appointmentTypeId: Number(row.appointment_type_id),
      appointmentStatus: row.appointment_status[0],
      appointmentDate: startAt.toFormat('MM/dd/yyyy'),
      appointmentStartTime: startAt.toFormat('HH:mm'),
      appointmentDuration: row.appointment_duration,
      appointmentTimezone: row.department_timezone,
    }

    return ok(completedAppointment)
  }
  catch (e) {
    console.log('error converting row to completed appointment', e)
    return err(ErrCode.EXCEPTION)
  }
}

/**
 * Helper to create a JSON serializable rep. to return from state.
 * 
 * @param record 
 * @returns 
 */
function appointmentCompletedUserActivityRecordToJSON(record: AppointmentCompletedUserActivityRecord): AppointmentCompletedUserActivityRecordJSON {
  return {
    ...record,
    appointmentStartAt: record.appointmentStartAt.toISOString(),
    createdAt: record.createdAt.toString()
  }
}

export default workflow(function(_config) {
  return {
    //
    // Keep the time roughly what it has always been. IE:
    // the flow used to be triggered as a result of Athena ETL being completed.
    //
    cron: '0 3 * * ? *',
    startAt: State.InitInput,
    states: {
      //
      // A bit heavy handed to run an ECS task to make sure all options are initialized,
      // but makes it simpler to test for a value in say a choice state against strings
      // like 'true' or 'false'.
      //
      [State.InitInput]: task({
        handler: async (context, input) => {
          return ok({
            //
            // WRT dry_run, if explicity provided use it, otherwise force dry_run in production.
            //
            // This implies when the flow is run automatically, it will run in dry run mode.
            // Once, we are comfortable it is working properly after manual invokations in production,
            // dry run will default to false.
            //
            dry_run: input.dry_run !== undefined ? (input.dry_run === true ? 'true' : 'false') : 'false',
          } as JsonObject)
        },
        next: State.GetToken,
      }),
      [State.GetToken]: Sync.getToken({
        name: SYNC_TOKEN_NAME,
        output: function(output, input) {
          return {
            ...input,
            ...output,
          }
        },
        next: State.WarehouseQuery,
      }),
      [State.WarehouseQuery]: Redshift.query({
        input: function (input) {
          input['next_token'] = Date.now() / 1000 | 0
          return input
        },
        sql: function(input) {
          const schema = 'diff'
          const { token, next_token: nextToken } = input
          const previous = `${DIFF_TABLE_BASENAME}_${token}`
          const next = `${DIFF_TABLE_BASENAME}_${nextToken}`

          return `
            --- #1
            BEGIN;

            --- #2
            CREATE TABLE ${schema}.${next} AS
              SELECT 
                appointment_id,
                status AS appointment_status
                FROM fq_common_telenutrition.schedule_appointment;
            
            --- #3
            ---
            --- First, select all appointments which should be considered completed.
            --- Completed appointments are onces which either have a status of 3 or 4.
            ---
            WITH 
              completed_appointments AS (
                SELECT
                  appointment_id,
                  patient_id,
                  department_id,
                  appointment_type_id,
                  status as appointment_status,
                  date as appointment_date, 
                  start_time as appointment_start_time,
                  duration as appointment_duration
                FROM fq_common_telenutrition.schedule_appointment
                WHERE 
                  (patient_id IS NOT NULL) AND
                  (
                    appointment_status = '3' OR 
                    appointment_status = '4'
                  )
              ),
              --- #4
              ---
              --- Of the completed appointments identity which ones are newly completed.
              ---
              newly_completed_appointments as (
                SELECT
                  N.appointment_id 
                FROM ${schema}.${next} N
                LEFT JOIN ${schema}.${previous} P ON N.appointment_id = P.appointment_id
                WHERE
                  SUBSTRING(NVL(P.appointment_status, '') for 1) != '3' AND
                  SUBSTRING(NVL(P.appointment_status, '') for 1) != '4' AND
                  (
                    SUBSTRING(NVL(N.appointment_status, '') for 1) = '3' OR
                    SUBSTRING(NVL(N.appointment_status, '') for 1) = '4'
                  )
              )
            --- #5
            SELECT 
              UP.user_id,
              U.identity_id as user_identity_id,
              CA.patient_id,
              P.identity_id as patient_identity_id,
              NCA.appointment_id,
              CA.appointment_type_id,
              CA.appointment_status,
              CA.appointment_date,
              CA.appointment_start_time,
              CA.appointment_duration,
              D.timezone as department_timezone
            FROM newly_completed_appointments NCA
            INNER JOIN completed_appointments CA 
              ON NCA.appointment_id = CA.appointment_id
            INNER JOIN fq_common_telenutrition.schedule_patient P 
              ON P.patient_id = CA.patient_id
            INNER JOIN fq_common_telenutrition.schedule_user_patient UP
              ON CA.patient_id = UP.patient_id
            INNER JOIN fq_common_telenutrition.iam_user U
              ON UP.user_id = U.user_id
            INNER JOIN fq_common_telenutrition.schedule_department D
              ON CA.department_id = D.department_id
            ;
            
            --- #6
            COMMIT;
          `
        },
        output: function (output, input) {
            const { results } = output
            const ROW_RESULT_OF_FINAL_SELECT = 3

            const completedAppointments: CompletedAppointment[] = []
            const warehouseQueryErrors: number[] = []

            for (const row of results[ROW_RESULT_OF_FINAL_SELECT].rows) {
              console.log(row)
              const result = rowToCompletedAppointment(row)

              if (result.isErr()) {
                warehouseQueryErrors.push(row.appointment_id)
              }
              else {
                console.log(result.value)
                completedAppointments.push(result.value)
              }
            }
  
            return {
              ...input,
              completed_appointments: completedAppointments,
              warehouse_query_errors: warehouseQueryErrors,
            }
          },
          next: State.CreateActivities,  
      }),
      [State.CreateActivities]: task({
        handler: async (context, input) => {
          const { logger } = context
          const isDryRun = input.dry_run === 'true' ? true : false
          //
          // Input can come in either as a 'completed appointments' in the input
          // or the result of a warehouse query
          //
          const completedAppointments = input.completed_appointments as CompletedAppointment[]
          const TAG = [ ...MTAG, 'CreateActivities']
          const createdActivities: AppointmentCompletedUserActivityRecordJSON[] = []
          const completedAppointmentErrors: CompletedAppointment[] = []

          for (const completedAppointment of completedAppointments) {
            if (isDryRun) {
              logger.info(context, TAG, 'Dry run, skipping activity creation.', {
                completedAppointment
              })
            }
            else {
              const { appointmentDate, appointmentStartTime, appointmentTimezone } = completedAppointment
              const startAt = DateTime.fromFormat(`${appointmentDate} ${appointmentStartTime}`, 'MM/dd/yyyy HH:mm', {
                zone: appointmentTimezone
              })

              const result = await createUserActivity(context, {
                activityTypeId: ActivityTypeIds.AppointmentCompleted,
                ...completedAppointment,
                appointmentStartAt: startAt.toJSDate()
              })

              if (result.isOk()) {
                createdActivities.push(appointmentCompletedUserActivityRecordToJSON(result.value))
              }
              else {
                logger.error(context, TAG, 'Error inserting user activity.', {
                  error: result.error
                })
                completedAppointmentErrors.push(completedAppointment)
              }
            }
          }
          return ok({
            created_activities: createdActivities,
            create_activities_errors: completedAppointmentErrors,
          })
        },
        output: function(output, input) {
          return {
            ...input,
            ...output,
          }
        },
        next: State.BranchOnCreateActivities,
      }),
      [State.BranchOnCreateActivities]: choice({
        choices: [
          {
            variable: '$.dry_run',
            stringEquals: 'true',
            next: State.Success,
          }
        ],
        default: State.UpdateToken,
      }),
      [State.UpdateToken]: Sync.updateToken({
        name: SYNC_TOKEN_NAME,
        value: function (input) {
          return String(input.next_token)
        },
        output: function(output, input) {
          return {
            ...input,
            ...output,
          }
        },
        next: State.EmitEvent,
      }),
      [State.EmitEvent]: task({
        handler: async (context, input) => {
          await publishUserActivitiesCreatedEvent(context, {
            num_activities: Array.isArray(input.created_activities) ? input.created_activities.length : null 
          })

          return ok(input)
        },
        next: State.Success,
      }),
      [State.Success]: succeed()
    },
  }
})