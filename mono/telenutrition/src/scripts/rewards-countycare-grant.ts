/**
 * Consume a CSV of county care rewards which have been granted and backfill relevant data.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { DateTime } from 'luxon'
import '@mono/common/lib/zapatos/schema'

import Context from '@mono/common/lib/context'

import yargs, { Argv } from 'yargs'
import { parse } from 'csv-parse/sync'
import { grantRewardForActivity } from '../rewards/service'

const ACTIVITY_ID = 1
const INCENTIVE_CONTRACT_25 = 1
const INCENTIVE_CONTRACT_15 = 2
const REWARD_ID_25 = 1
const REWARD_ID_15 = 2

const MTAG = [ 'telenutrition', 'scripts', 'rewards-countycare-backfill' ]

const processArgv = [ ...process.argv ]

if (processArgv.length && processArgv[0].endsWith('bin.js')) {
  processArgv.shift()
}

// if (processArgv.length && processArgv[0].endsWith('send-countycare-incentives-rewards-v2.ts')) {
//   processArgv.shift()
// }

console.log('ARGS1:')
console.log(processArgv)

const argv = yargs(processArgv).command(
  '$0 <appointments>',
  'Reward appointments satisfying incentive',
  (yargs: Argv) => {
    return yargs.positional('appointments', {
      describe: 'CSV containing appointments for which incentive rewards have been granted.',
      type: 'string',
      demandOption: true,
    }).option('l', {
      alias: 'log',
      type: 'string',
      demandOption: false,
      default: '-'
    }).option('D', {
      alias: 'date',
      type: 'string',
      demandOption: false,
      default: '',
    })
  },
).argv

type CsvRecord = Record<string, any>

console.log(`ARGS2: `, argv)

function getCsv(file: string): CsvRecord[] {
  const appointmentData = readFileSync(file)
  
  return parse(appointmentData, {
    columns: true,
    skip_empty_lines: true,
    cast: function(value, context) {
      const numericColumns: string[] = [
        'user_id',
        'user_identity_id',
        'patient_id',
        'appointment_id',
        'appointment_type_id',
      ]
  
      if (context.header) {
        return value
      }
      if (numericColumns.includes(context.column as string)) {
        return Number(value)
      }
      return value
    }
  })
}

  
export interface Arguments {
  appointments: string,
  log: string,
  date: string,
}

const INITIAL_APPOINTMENT_TYPE_IDS = [
  2,
  4,
  281
]

enum AppointmentType {
  Initial = 'INITIAL',
  Followup = 'FOLLOWUP',
}

function appointmentTypeById(appointmentTypeId: number): AppointmentType {
  return INITIAL_APPOINTMENT_TYPE_IDS.includes(appointmentTypeId) ? AppointmentType.Initial : AppointmentType.Followup
}
  
  async function main(): Promise<void> {
    const context = await Context.create()
    const { logger } = context
    const args: Arguments = argv as unknown as Arguments
    const TAG = [ ...MTAG, 'main' ]
  
    console.log(`ARGS: `, args)
  
    try {
      let numSuccesses = 0
      let numErrors = 0
      const appointments = getCsv(args.appointments)

      for (const appointment of appointments) {
        const appointmentType = appointmentTypeById(appointment.appointment_type_id)
        const incentiveContractId = appointmentType === AppointmentType.Initial ? 1 : 2
        const rewardId = appointmentType === AppointmentType.Initial ? 1 : 2
        const result = await grantRewardForActivity(
          context,
          ACTIVITY_ID,
          incentiveContractId,
          rewardId, {
            userId: appointment.user_id,
            appointmentId: appointment.appointment_id,
            instacartCode: appointment.code,
            sendCioEvent: false,
          }
        )

        if (result.isErr()) {
          logger.error(context, TAG, 'Error backfilling record.', {
            appointment,
          })

          numErrors++
        }
        else {
          numSuccesses++
        }
      }
    }
    catch (e) {
      console.error('Exception encountered.', e)
  
      throw e
    }
  }
  
  main().then(() => process.exit(0))
  .catch(e => {
    console.error(e)
  
    process.exit(1)
  })
