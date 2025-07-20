import { succeed, workflow, task, JsonObject } from '@mono/common-flows/lib/builder';
import { IContext } from '@mono/common/lib/context';
import * as SegmentService from '@mono/common/lib/segmentation/service';
import { ok, err, Result } from 'neverthrow';
import { ErrCode } from '@mono/common/lib/error';
import { _FLOW_NAME as _PROCESS_FLOW_NAME } from './referrals-process-caloptima';

const MTAG = [ 'ops-flows', 'flows', 'segment-sync' ];

enum State {
  Create = 'Create',
  Success = 'Success',
}

export default workflow(function () {
  return {
    // For now we will check every hour, this should be sufficient for rate-based segment syncs
    // We also sync all segments at once, this is fine for now as we don't have a large number of segments
    // We will want to fire off tasks in parallel for each segment in the future
    // We will also want to be able to trigger this flow via events to sync segments that are trigger-based
    rate: '1 hour',
    startAt: State.Create,
    states: {
      [State.Create]: task({
        handler: async (context: IContext): Promise<Result<JsonObject, ErrCode>> => {
          const { logger } = context
          const TAG = [ ...MTAG, State.Create ]

          try {
            logger.info(context, TAG, 'Starting segment sync flow, getting due segment ids');

            const dueSegmentIdsResult = await SegmentService.getDueSegmentIds(context);

            if (dueSegmentIdsResult.isErr()) {
                logger.error(context, TAG, 'Error getting due segment ids', { error: dueSegmentIdsResult.error });
            } else {
                const dueSegmentIds = dueSegmentIdsResult.value;

                logger.info(context, TAG, `Received ${dueSegmentIds.length} due segment ids`, { dueSegmentIds });

                if (dueSegmentIds.length > 0) {                    
                    await SegmentService.syncAllSegments(context, dueSegmentIds);
                }
            }

            return ok({ status: 'success' });
          } catch (e) {
            return err(ErrCode.EXCEPTION);
          }
        },
        next: State.Success,
      }),
      [State.Success]: succeed(),
    },
  };
});
