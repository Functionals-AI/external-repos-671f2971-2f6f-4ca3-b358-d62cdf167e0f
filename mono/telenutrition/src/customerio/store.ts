import { err, ok, Result } from 'neverthrow'
import { ErrCode } from '@mono/common/lib/error'
import Logger from '@mono/common/lib/logger'
import { IContext } from '@mono/common/lib/context'
import { SegmentRecord } from './service'
import * as db from 'zapatos/db'
import '@mono/common/lib/zapatos/schema'
import * as zs from 'zapatos/schema'


const MTAG = Logger.tag()


async function insertSegment(context: IContext, segment: SegmentRecord): Promise<Result<zs.marketing.cio_segment.JSONSelectable, ErrCode>> {
  const TAG = [...MTAG, 'insertSegment']
  const { store, logger } = context

  try {
    const pool = await store.writer()
    const selectable = await db.insert('marketing.cio_segment', {
      segment_id: segment.segmentId,
      name: segment.name,
      description: segment.description,
      count: segment.count,
      sql: segment.sql,
      run_interval: segment.runInterval
    }).run(pool)

    return ok(selectable)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export interface ScheduledSegment {
  segmentId: number;
  name: string;
  description: string;
  createdAt: Date;
  runInterval: string | null;
  lastStartedAt: Date | null;
}

async function selectScheduledSegmentsToSync(context: IContext): Promise<Result<ScheduledSegment[], ErrCode>> {
  const tag = [...MTAG, 'selectScheduledSegmentsToSync'];
  const { logger, store: { reader } } = context

  try {
    const pool = await reader();
    logger.debug(context, tag, 'fetching scheduled segments')

    const segments = await db.sql<zs.marketing.cio_segment_run.SQL | zs.marketing.cio_segment.SQL, ScheduledSegment[]>`
      SELECT 
        S.${'segment_id'} AS "segmentId",
        S.${'name'},
        S.${'description'},
        S.${'created_at'} AS "createdAt",
        S.${'run_interval'} AS "runInterval",
        SR.${'started_at'} AS "lastStartedAt"
      FROM ${'marketing.cio_segment'} S
      LEFT JOIN ${'marketing.cio_segment_run'} SR ON S.${'segment_run_id'} = SR.${'segment_run_id'}
      WHERE S.${'run_interval'} IS NOT NULL 
        AND (SR.${'started_at'} IS NULL 
          OR SR.${'started_at'} + S.${'run_interval'} < now())
      ORDER BY S.${'segment_id'};
    `.run(pool);

    logger.debug(context, tag, 'fetched scheduled segments', { count: segments.length })
    return ok(segments)
  } catch (e) {
    logger.exception(context, tag, e);
    return err(ErrCode.EXCEPTION);
  }
}


export default {
  insertSegment,
  selectScheduledSegmentsToSync
}