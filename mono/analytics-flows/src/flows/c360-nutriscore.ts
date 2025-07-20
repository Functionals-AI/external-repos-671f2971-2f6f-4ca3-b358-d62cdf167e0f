import { succeed, workflow } from '@mono/common-flows/lib/builder'
import { CalculateZheiValuesQuery, SummaryNutriscoreQuery } from '../tasks'

enum State {
  CalculateZheiValues = 'CalculateZheiValues',
  SummaryNutriscore = 'SummaryNutriscore',
  Success = 'Success',
}  

export default workflow(function(config) {
  return {
    event: {
      bus: 'default',
      source: [ 'foodsmart' ],
      detailType: [ 'foodapp.warehouse.sync.completed' ],
    },
    startAt: State.CalculateZheiValues,
    states: {
      [State.CalculateZheiValues]: CalculateZheiValuesQuery({
        next: State.SummaryNutriscore,
      }),
      [State.SummaryNutriscore]: SummaryNutriscoreQuery({
        next: State.Success
      }),
      [State.Success]: succeed(),
    }
  }
})
