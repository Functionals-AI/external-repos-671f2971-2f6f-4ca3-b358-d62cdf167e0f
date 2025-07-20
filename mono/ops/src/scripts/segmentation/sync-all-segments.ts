import '@mono/common/lib/zapatos/schema';

import { Result, ok, err } from 'neverthrow';
import { ErrCode } from '@mono/common/lib/error';
import Context from '@mono/common/src/context';
import * as SegmentService from '@mono/common/src/segmentation/service';

const MTAG = ['ops', 'scripts', 'segmentation', 'sync-all-segments'];

type LogLevel = 'message' | 'full';
const LOG_LEVEL: LogLevel = 'message';

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

    const { logger } = context;
    const TAG = [...MTAG, 'main'];

    try {
        //await SegmentService.syncAllSegments(context);

        while (true) {
            const dueSegmentIdsResult = await SegmentService.getDueSegmentIds(context);

            if (dueSegmentIdsResult.isErr()) {
                console.error('Error getting due segment ids - ', dueSegmentIdsResult.error);
            } else {
                const dueSegmentIds = dueSegmentIdsResult.value;

                console.log('dueSegmentDestinationMappingIds - ', dueSegmentIds);

                if (dueSegmentIds.length > 0) {                    
                    await SegmentService.syncAllSegments(context, dueSegmentIds);
                }
            }

            process.stdout.write('Sleeping for 60s: ');

            //sleep for 60 seconds, print a dot for every 2 seconds that elapses and a pipe at every 10 seconds
            for (let i = 1; i <= 30; i++) {
                await new Promise(resolve => setTimeout(resolve, 2000));

                if (i % 5 === 0) {
                    process.stdout.write((i * 2).toString());
                } else {
                    process.stdout.write('.');
                }
            }

            process.stdout.write('\n');
        }

        return ok(undefined);
    }
    catch (e) {
        logger.exception(context, TAG, e);

        return err(ErrCode.EXCEPTION);
    }
}

main().then(() => {
    process.exit(0);
}).catch(e => {
    console.log('Exception during syncing of segments', e);

    process.exit(1);
});