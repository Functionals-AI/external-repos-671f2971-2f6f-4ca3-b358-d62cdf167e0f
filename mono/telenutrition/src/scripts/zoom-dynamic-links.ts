import Context from '@mono/common/lib/context';
import Scheduling from '../scheduling/'

const TAG = 'scripts.zoom-dynamic-links';

async function main() {
  const context = await Context.create();
  const { logger } = context

  try {
    const result = await Scheduling.Sync.updateMeetingLinks(context)
    if (result.isErr()) {
      logger.error(context, `${TAG}.error`, 'Error updating meeting links', { errCode: result.error })
      return 
    }

    logger.info(context, `${TAG}.completed`, 'Meeting links update complete', result.value)
  } catch(e) {
    logger.exception(context, `${TAG}.main`, e)
  } finally {
    await Context.destroy(context)
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
