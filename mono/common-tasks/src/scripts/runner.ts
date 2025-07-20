
import Tasks from '@mono/common/lib/tasks'
import { ScriptRegistry } from '@mono/common/lib/tasks/script'
import {ScriptNames} from './index'
import Warehouse from './warehouse'

const TAG = 'app.task-runner'

const registry: ScriptRegistry = {
  [ScriptNames.WarehouseSync]: Tasks.Script.register(Warehouse.sync)
}

async function main() {
  const name = process.argv[2]
  const args = [...process.argv].slice(3)

  if (!(name in registry)) {
    console.error(`${name} not found in scripts registry`)
    process.exit(1)
  }

  const handler = registry[name]

  await handler(name, args)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})