import Context from '@mono/common/lib/context'

import Warehouse from '../qcs/warehouse'


const TAG = 'scripts.copy'

async function main() {
  const context = await Context.create()
  const { config, logger } = context

  try {
    logger.info(context, `${TAG}.start`, 'copy started')

    const res = await Warehouse.copyTables(context)


    logger.info(context, `${TAG}.finish`, 'copy finished')
  } catch (e) {
    logger.exception(context, `${TAG}.error`, e)
  } finally {
    await Context.destroy(context)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})