import Context from '@mono/common/lib/context'
import {AccountIds} from '@mono/common/lib/account/service'

const TAG = 'scripts.create-enrollment-link'

import {createEnrollmentLink, parseEnrollmentToken, createEnrollmentToken} from '../../iam/enrollment'

const _ACCOUNT_ID = AccountIds.FidelisCare
const _ELIGIBLE_ID = 107486

async function main() {
  const context = await Context.create()
  const { logger } = context

  try {
    const resultToken = await createEnrollmentToken(context, _ACCOUNT_ID, _ELIGIBLE_ID)

    if (resultToken.isErr()) {
      logger.error(context, TAG, 'failed to create token')
      return
    }

    const token = resultToken.value

    const resultLink = await createEnrollmentLink(context, _ACCOUNT_ID, {eligibleId: _ELIGIBLE_ID, lang: 'es'})

    if (resultLink.isErr()) {
      logger.error(context, TAG, 'failed to create enrollment link from token')
      return
    }

    const link = resultLink.value

    console.log(`generated link: ${link}`)

    const resultParse = parseEnrollmentToken(context, token)

    if (resultParse.isErr()) {
      logger.error(context, TAG, 'failed to parse enrollment token')
      return
    }

    console.log(`parsed token: ${JSON.stringify(resultParse.value)}`)

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