import { IContext } from '../../context'
import { ErrCode } from '../../error'
import { err, ok, Result } from 'neverthrow'
import { JsonObject } from '../../json'
import Logger from '../../logger'
const MTAG = Logger.tag()

import { WebClient, ChatPostMessageArguments } from '@slack/web-api';

/**
 * Slack postMessage function.
 * @param context Context
 * @param {string} channel - The Slack Channel we want to post message to, should start with a '#'
 * @param {string} message
 * @param {string} username - (Optional) Send message with a customized username
 */
async function postMessage(context: IContext, channel: string, message: string, username?: string): Promise<Result<JsonObject, ErrCode>> {
  const TAG = [...MTAG, 'postMessage']
  const { config, logger } = context

  const SLACK_TOKEN = config.common.slack.slack_token
  const slackClient = new WebClient(SLACK_TOKEN)

  let postMessageParams: ChatPostMessageArguments = {
    text: message,
    channel: channel
  }

  if (username !== undefined) {
    postMessageParams.username = username
  }

  logger.info(context, TAG, `posting message - ${message} to channel - ${channel}`)

  try {
    const postMessageToSlackResult = await slackClient.chat.postMessage(postMessageParams)

    logger.info(context, TAG, `postMessageToSlackResult is - ${postMessageToSlackResult}`)

    return ok({
      message, channel
    })
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  postMessage,
}