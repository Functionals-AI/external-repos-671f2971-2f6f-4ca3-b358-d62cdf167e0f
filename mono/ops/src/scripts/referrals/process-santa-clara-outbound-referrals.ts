import { Result, ok, err } from 'neverthrow'

import * as db from 'zapatos/db';
import '@mono/common/lib/zapatos/schema';
import * as zs from 'zapatos/schema';

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'

import Context from '@mono/common/src/context';
import { completeReferralFoodActions, createReferralDeclineActions, createReferralFoodActions } from '@mono/common/src/referral/sources/santaclara/process-referrals';

type LogLevel = 'message' | 'full';
const LOG_LEVEL: LogLevel = 'full';

const MTAG = ['ops', 'scripts', 'referrals', 'process-santa-clara-outbound-referrals'];

const S3_KEY_PREFIX = 'santa-clara/outbound/'
const S3_FILENAME_PREFIX_PROD = 'Prod_Foodsmart_MTMMSFAuthorizations_'
const S3_FILENAME_PREFIX_TEST = 'Test_Foodsmart_MTMMSFAuthorizations_'

async function main(): Promise<Result<void, ErrCode>> {
    const context = await Context.create();

    if (LOG_LEVEL !== 'full') {
        context.logger = {
            info: ((_context, _tag, message, _meta) => { console.log(message); }),
            warn: ((_context, _tag, message, _meta) => { console.log(message); }),
            error: ((_context, _tag, message, _meta) => { console.log(message); }),
            fatal: ((_context, _tag, message, _meta) => { console.log(message); }),
            debug: ((_context, _tag, message, _meta) => { console.log(message); }),
            trace: ((_context, _tag, message, _meta) => { console.log(message); }),
            exception: ((_context, _tag, message, _meta) => { console.log(message); }),
            tag: () => { return [] }
        }
    }

    const { logger, config } = context;
    const TAG = [...MTAG, 'main'];

    // create actions for Santa Clara outbound referrals that should receive a food benefit
    await createReferralFoodActions(context);

    // create actions for Santa Clara outbound referrals that should be declined
    await createReferralDeclineActions(context);

    const srcBucket = config.ops_cdk?.data?.destBuckets?.externalData.name;

    if (!srcBucket) {
      return err(ErrCode.EXCEPTION);
    }

    const todaysDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const key = config.env === 'production' ? `${S3_KEY_PREFIX}${S3_FILENAME_PREFIX_PROD}${todaysDate}.txt` : `${S3_KEY_PREFIX}${S3_FILENAME_PREFIX_TEST}${todaysDate}.txt`;

    // complete referral actions for the above by writing record to S3 and updating referral action status
    await completeReferralFoodActions(context, srcBucket, key);

    return ok(undefined);
}

main().then(() => {
    console.log('Referral processing completed.')

    process.exit(0)
}).catch(e => {
    console.log('Exception during referral processing.\n', e)

    process.exit(1)
})