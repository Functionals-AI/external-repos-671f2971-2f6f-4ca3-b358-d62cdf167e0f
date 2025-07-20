import { Result, ok, err } from 'neverthrow'
import { Browser, BrowserContext, Page, chromium } from 'playwright'
import { ErrCode } from '@mono/common/lib/error'
import { IContext } from '@mono/common/lib/context'

export { Page } from 'playwright'

/* The E2EBrowserContext` interface specifies the structure of an object that represents a browser
context used in end-to-end testing scenarios. It includes properties such as `browser`,
`browserContext`, `page`, `debug`, `headed`, `extendedLogging`, and `baseUrl`. 
*/
export interface E2EBrowserContext {
  browser: Browser,
  browserContext: BrowserContext,
  page: Page,
  debug?: boolean,
  headed?: boolean,
  extendedLogging?: boolean,
  baseUrl?: string
}

const MTAG = ['telenutrition-e2e', 'browser', 'e2e-context']

export async function createBrowserContext(context: IContext, debug = false, headed = false): Promise<Result<E2EBrowserContext, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'createBrowserContext']

  try {
    let browser: Browser
    let browserContext: BrowserContext

    browser = await chromium.launch({
      headless: !headed,
      devtools: debug && headed,
      logger: {
        isEnabled: (name, severity) => debug || (!debug && name === 'api'),
        log: (name, severity, message, args) => {
          const parsedArgs = JSON.stringify(args, null, 2)
          let argsLog = ''
          if (parsedArgs && parsedArgs !== '[]') {
            argsLog = ` | Args: ${JSON.stringify(args, null, 2)}`
          }
          console.log(`Name: ${name} | Severity: ${severity} | Message: ${message}${argsLog}`)
        }
      }
    })

    browserContext = await browser.newContext({
      viewport: {
        width: 1720,
        height: 1294
      },
      /* Removed for now. */
      // recordHar: {
      //   path: `./src/browser/logs/har/${DateTime.now().toString()}.har`
      // },
      // recordVideo: {
      //   dir: './src/browser/logs/video' 
      // }
    })

    const page = await browserContext.newPage()

    return ok({
      browser: browser,
      browserContext: browserContext,
      page: page,
      debug: debug,
      headed: headed
    })
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export async function destroyBrowserContext(context: IContext, sourceContext: E2EBrowserContext): Promise<Result<void, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'destroyBrowserContext']

  try {
    logger.info(context, TAG, `closing browser`)

    const {
      browser,
      browserContext
    } = sourceContext

    await browserContext.close()
    await browser.close()

    return ok(undefined)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export default {
  createBrowserContext,
  destroyBrowserContext
}
