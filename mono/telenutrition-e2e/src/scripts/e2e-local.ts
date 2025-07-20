import Context from '@mono/common/lib/context'
import { E2EScheduleVerificationMethods } from '../browser/telenutrition/member/schedule/base'
import { runBrowserE2E } from '../browser/telenutrition/member/schedule/scheduling'

const MTAG = [ 'telenutrition-e2e', 'scripts', 'e2e-local' ]
const TESTSUITES = ['Email', 'SMS', 'Token']

async function main() {
  console.log(JSON.stringify(process.env))
  const context = await Context.create()
  const { logger } = context
  const TAG = [ ...MTAG, 'main' ]

  try {
    const playwrightDebugMode = (process?.env?.PWDEBUG !== undefined && process?.env?.PWDEBUG === "1")
    const headedBrowser = (process?.env?.HEADED !== undefined && process?.env?.HEADED === '1')
    const testSuite = (process?.env?.TESTSUITE !== undefined && TESTSUITES.includes(process?.env?.TESTSUITE)) ? TESTSUITES.indexOf(process?.env?.TESTSUITE) : E2EScheduleVerificationMethods.Email

    const browserRunnerResult = await runBrowserE2E(context, playwrightDebugMode, headedBrowser, testSuite)

    if (browserRunnerResult.isErr()) {
      return 1
    }

  } catch (e) {
    logger.exception(context, `${TAG}.error`, e)
    return 1
  } finally {
    await Context.destroy(context)
  }

  return 0
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
