import Qualtrics from '../qualtrics'
import Context from '@mono/common/lib/context'
import { SyncResponsesReport } from '../qualtrics/sync'

async function main() {
  const TAG = 'scripts.qualtrics.sync-survey-responses'
  const context = await Context.create()
  const {config, logger} = context
  const reports: SyncResponsesReport[] = []

  console.log(config.qualtrics)
  try {    
    for (let surveyId of config.qualtrics.sync.surveyIds) {
      const resultSync = await Qualtrics.Sync.syncResponses(context)
     
      if (resultSync.isErr()) {
       logger.error(context, `${TAG}.error`, 'Qualtrics responses sync error', {surveyId, errCode: resultSync.error})
       return 
      }

      const reports = resultSync.value
    }

    logger.info(context, `${TAG}.completed`, 'Qualtric responses sync successful', reports)
  } catch(e) {
    logger.exception(context, `${TAG}.main`, e)
  } finally {
    await Context.destroy(context)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})