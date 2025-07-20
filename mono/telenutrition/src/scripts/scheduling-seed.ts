import * as _ from 'lodash'

import * as db from 'zapatos/db'
import '@mono/common/lib/zapatos/schema'
import * as zs from 'zapatos/schema'

import {Context} from '@mono/common'

import { DateTime } from 'luxon'

const times = [
  '9:00AM',
  '9:30AM',
  '10:00AM',
  '10:30AM',
  '11:00AM',
  '11:30AM',
  '12:00PM',
  '12:30PM',
  '1:00PM',
  '1:30PM',
  '2:00PM',
  '2:30PM',
  '3:00PM',
  '3:30PM',
  '4:00PM',
  '4:30PM',
  '5:00PM',
  '5:30PM',
]

type Provider = {department_id: number, provider_id: number}

async function main() {
  const context = await Context.create()
  const {logger, store: {reader}} = context

  const pool = await reader()
  const providers = await db.select('telenutrition.schedule_department_provider', {provider_id: db.sql`${db.self} <> 1`}, {
    groupBy: 'provider_id',
    columns: ['provider_id'],
    extras: {
      department_id: db.sql`MIN(department_id)`
    }
  }).run(pool)

  console.log(providers)
  let date = DateTime.now()
  const rows: any[] = []

  for (let i = 0; i < 90; i++) {
    const providerSample: Provider[] = _.sampleSize(providers, 10)
    console.log(providerSample)
  
    for (let provider of providerSample) {
      const timesSample: string[] = _.sampleSize(times, Math.floor(times.length/2))
  
      for (let time of timesSample) {
        rows.push([1, date.toFormat('MM/dd/yyyy'), 30, time, provider.provider_id, provider.department_id, 'f', provider.provider_id, `${date.toFormat('yyyy-MM-dd')} ${time.slice(0, -2)}-07`, 'o'])
      }
    }
  
    date = date.plus({ days: 1 })
  }

  console.log(`
  INSERT INTO "telenutrition"."schedule_appointment" ("appointment_type_id", "date", "duration", "start_time", "provider_id", "department_id", "frozen", "rendering_provider_id", "start_timestamp", "status") VALUES
    ${rows.map(row => `(${row[0]}, '${row[1]}', ${row[2]}, '${row[3]}', ${row[4]}, ${row[5]}, '${row[6]}', '${row[7]}', '${row[8]}', '${row[9]}')`).join(',')};
  `)
}

main()






