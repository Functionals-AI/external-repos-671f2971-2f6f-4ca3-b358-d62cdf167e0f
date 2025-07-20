import { err, ok } from 'neverthrow'
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'
import { succeed, workflow } from '@mono/common-flows/lib/builder'
import { EventTypes, detailType } from '@mono/common-flows/lib/tasks/aws/eventbridge'
import { query } from '@mono/common-flows/lib/tasks/aws/redshift'

const EVENT_BUS = 'default'
const EVENT_TYPE = detailType({
    type: EventTypes.FlowCompleted,
    domain: 'analytics-flows',
    flowName: 'DimAppointment',
})

enum State {
    RefreshViews = 'RefreshViews',
    Success = 'Success'
  }

export default workflow(function(config) {
    return {
        event: {
              bus: EVENT_BUS,
              source: [ 'foodsmart'
                ],
              detailType: [
                EVENT_TYPE
                ]
            },
      startAt: 'RefreshViews',
          states: {
            [State.RefreshViews]: query({
              sql: `
        BEGIN TRANSACTION;
        CALL refresh_all_materialized_views('deident_telenutrition');
        END TRANSACTION;
        `,
        credentials: {
          user: config.redshift.credentials?.migrations.user as string,
          password: config.redshift.credentials?.migrations.password as string,
        },
        next: State.Success
            }),
            [State.Success]: succeed()
          }
        }
      })
      