import { err, ok } from 'neverthrow'
import { PublishCommand } from '@aws-sdk/client-sns'

import { ErrCode } from '@mono/common/lib/error'
import { JsonObject, task, workflow } from '@mono/common-flows/lib/builder'
import { getOutboundReferralCount } from '@mono/common/lib/referral/store'

const MTAG = ['ops-flows', 'flows', 'referrals-monitor-caloptima']

enum State {
    GetReferralCount = 'GetReferralCount'
}

export default workflow(function (config) {
    //
    // Alerts should only be triggered in production.
    //
    if (config.isProduction) {
        return {
            rate: '1 day',
            startAt: State.GetReferralCount,
            states: {
                [State.GetReferralCount]: task({
                    handler: async (context) => {
                        const { aws: { snsClient, }, logger } = context
                        const TAG = [...MTAG, State.GetReferralCount]

                        const days = 2
                        const accountId = 61

                        const result = await getOutboundReferralCount(context, accountId, days)

                        if (result.isErr()) {
                            return err(result.error)
                        }

                        const topicArn = config.ops_cdk.sns?.alertsCalOptimaReferralsArn

                        if (!topicArn) {
                            logger.error(context, TAG, 'Topic arn not found.')

                            return err(ErrCode.INVALID_CONFIG)
                        }

                        const recentReferralCount = result.value

                        if (!(recentReferralCount > 0)) {
                            let subject = '', message = ''

                            if (recentReferralCount == 0) {
                                logger.warn(context, TAG, `No referrals found for the past ${days} days for account id ${accountId}`)

                                subject = `Referral count zero over past ${days} days (${config.env})`
                                message = `No referrals found for the past ${days} days for account id ${accountId}.`

                            } else {
                                logger.error(context, TAG, `Unable to get referral count for the past ${days} days for account id ${accountId}`)

                                subject = `Referral count error over past ${days} days (${config.env})`
                                message = `Unable to get referral count for the past ${days} days for account id ${accountId}.`
                            }

                            const params = {
                                TopicArn: topicArn,
                                Subject: subject,
                                Message: message,
                            }

                            const command = new PublishCommand(params)

                            await snsClient.send(command)
                        } else {
                            logger.info(context, TAG, `Found ${recentReferralCount} referrals for the past ${days} days for account id ${accountId}`)
                        }

                        return ok(recentReferralCount as any as JsonObject)
                    }
                })
            }
        }
    }
})