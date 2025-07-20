import { Result, ok, err } from 'neverthrow'
import { DateTime } from 'luxon'
import { ErrCode } from '@mono/common/lib/error'
import { IContext } from '@mono/common/lib/context'
import { E2EBrowserContext } from '../../browser/e2e-context'

const MTAG = ['telenutrition-e2e', 'util', 'data', 'file']

export enum ScreenshotFileTypes {
  JPEG = 'jpeg',
  PNG = 'png'
}

export type ScreenshotFileType = ScreenshotFileTypes.JPEG | ScreenshotFileTypes.PNG

export enum ScreenshotFileStores {
  LOCAL,
  S3
}

export type ScreenshotFileStoreType = ScreenshotFileStores.LOCAL | ScreenshotFileStores.S3

export type ScreenshotContext = {
  e2e_context: E2EBrowserContext,
  file_store?: ScreenshotFileStoreType,
  file_type?: ScreenshotFileType,
  tags: Array<string>,
  full_page?: boolean
}

/**
 * The function `filenameFromTAG` takes an array of tags and a file type, trims the tags, joins them
 * with hyphens, and appends the file type to create a filename.
 * @param tags - An array of strings representing tags associated with the code being executed.
 * @param {ScreenshotFileType} fileType - ScreenshotFileType is an enum that represents the type of
 * file for a screenshot, such as PNG or JPEG.
 * @returns a string that consists of the tags from the input array, trimmed and joined with hyphens,
 * followed by a dot and the file type specified.
 */
function filenameFromTAG(tags: Array<string>, fileType: ScreenshotFileType): string {
  const fileNameSuffix = [...tags].map(tag => tag.trim()).join('-') + '.' + fileType
  const now = DateTime.now()
  const formattedTimestamp = now.toFormat("yyyy-MM-dd-HH:mm:ss")
  const timestampedFileName = `${formattedTimestamp}_${fileNameSuffix}`
  return timestampedFileName
}


/**
 * This function saves a Playwright screenshot based on the provided context and screenshot settings.
 * @param {IContext} context - The `context` parameter in the `saveScreenshot` function is of type
 * `IContext`, which contains contextual information and utilities needed for the operation.
 * This includes things like a logger for logging messages, configurations, or any other
 * context-specific data and functions required during the screenshot saving process.
 * @param {ScreenshotContext} screenshot_context - The `screenshot_context` parameter in the
 * `saveScreenshot` function is an object that contains information related to taking a screenshot. It
 * includes properties such as `e2e_context` likely holds information about the end-to-end
 * testing context, `file_store` which specifies where the screenshot should be persisted.
 * @returns The `saveScreenshot` function returns a `Promise` that resolves to a `Result` object
 * containing either a `void` value or an `ErrCode` value.
 * 
 * Example to copy the screenshots from a local docker container:
 * ➜  ~ docker cp common-telenutrition-e2e-1:/app/telenutrition-e2e/src/browser/logs ~/Downloads/logs
 */
export async function saveScreenshot(context: IContext, screenshot_context: ScreenshotContext): Promise<Result<void, ErrCode>> {
  const { logger } = context
  const { page } = screenshot_context.e2e_context
  const TAG = [...MTAG, 'saveScreenshot']

  try {
    if (screenshot_context.e2e_context?.debug !== true) {
      return ok(undefined)
    }

    const fileStore = screenshot_context?.file_store || ScreenshotFileStores.LOCAL

    if (fileStore !== ScreenshotFileStores.LOCAL) {
      logger.error(context, TAG, `${fileStore} not implemented`)
      
      return err(ErrCode.NOT_IMPLEMENTED)
    }

    const fileType = screenshot_context?.file_type || ScreenshotFileTypes.JPEG
    const fullPage = screenshot_context?.full_page === undefined ? false : true
    const fileName = filenameFromTAG(screenshot_context.tags, fileType)
    const fileBasePath = './src/browser/logs/ss'
    const fullFilePath = `${fileBasePath}/${fileName}`

    const pageURL = new URL(page.url())
    logger.info(context, TAG, `pageURL: ${pageURL}`)
    logger.info(context, TAG, `Saving screenshot: ${fileName}`, screenshot_context)
    
    await page.screenshot({
      path: fullFilePath,
      type: fileType,
      fullPage: fullPage
    })
  } catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }

  return ok(undefined)
}
