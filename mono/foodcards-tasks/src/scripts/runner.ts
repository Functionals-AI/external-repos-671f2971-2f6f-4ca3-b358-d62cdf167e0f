
import Tasks from '@mono/common/lib/tasks'
import { ScriptRegistry } from '@mono/common/lib/tasks/script'
import {ScriptNames} from './index'
import InComm from './incomm'

const TAG = 'app.task-runner'

const registry: ScriptRegistry = {
  [ScriptNames.InCommSftpUpload]: Tasks.Script.register(InComm.sftpUpload),
  [ScriptNames.inCommSftpDownloadResponse]: Tasks.Script.register(InComm.sftpDownloadResponse)
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
