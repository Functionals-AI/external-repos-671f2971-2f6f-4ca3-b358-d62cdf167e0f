import Context from '@mono/common/lib/context'
import CioApi from '@mono/common/lib/integration/customerio/api'
import { CioEventType } from '@mono/common/lib/integration/customerio/service'

const TAG = 'scripts.cio-event'

async function main() {
  const context = await Context.create()
  const { logger } = context

  try {
    const response = {
      email: 'char.johnson007@gmail.com',
      first_name: 'Charlotte',
      last_name: 'Johnson',
      state: 'WI',
      phone: '+14142026194',
    }

    const customerResult = await CioApi.addOrUpdateCustomer(context, response.email, {
      _update: true,
      created_at: parseInt(String(Date.now()/1000))
    }, {
      firstname: response.first_name,
      lastname: response.last_name,
      state: response.state,
      phone: response.phone
    })

    if (customerResult.isErr()) {
      logger.error(context, `${TAG}.syncResponses`, `error creating customer in customer.io from response`)
    } else {
      // logger.info(context, `${TAG}.syncResponses`, `created cio customer for response`, {responseId: response.response_id})

      const eventResult = await CioApi.createEvent(context, response.email, {
        type: CioEventType.Event,
        name: 'schedule_telenutrition-form_submit',
      })
  
      // if (eventResult.isErr()) {
      //   logger.error(context, `${TAG}.syncResponses`, `error sending from response event`, {responseId: response.response_id})
      // } else {
      //   logger.info(context, `${TAG}.syncResponses`, `sent cio event for response`, {responseId: response.response_id})
      // }
  
    }

  } catch (e) {
    logger.exception(context, `${TAG}.error`, e)
  } finally {
    await Context.destroy(context)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})