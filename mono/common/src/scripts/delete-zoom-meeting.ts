import yargs, { Argv } from 'yargs'

import Context from '../context'
import Zoom from '../integration/zoom'

const processArgv = [ ...process.argv ]

if (processArgv.length && processArgv[0].endsWith('bin.js')) {
  processArgv.shift()
}

processArgv.shift()

console.log(`process.argv: ${processArgv}`)

const argv = yargs(processArgv).command(
  '$0 <ids..>',
  'Delete meetings.'
).argv

console.log(argv)

type Args = {
  ids: string[]
}


(async function main() {
  const context = await Context.create()
  const { config } = context;

  const meetingIds = (argv as unknown as Args).ids.map(id => String(id))

  for (const meetingId of meetingIds) {
    const result = await Zoom.Api.deleteMeeting(context, meetingId)

    if (result.isErr()) {
      console.error(`error: ${meetingId}`)
      console.log(`error`, result.error)
      return
    }

    console.log(`ok: ${meetingId}`)
  }
})()