import Context from '../context'
import {shortenLink, resolveLink} from '../shortlink'


(async function main() {
  const context = await Context.create()
  const { config } = context;

  const result = await shortenLink(context, config.telenutrition_web.baseUrl, {length: 10})

  if (result.isErr()) {
    console.log(`error`, result.error)
    return
  }

  console.log(`ok`, result.value)
  const link = result.value 

  const result2 = await resolveLink(context, link.code)

  if (result2.isErr()) {
    console.log(`error`, result2.error)
  } else {
    console.log(`ok`, result2.value)   
  }

})()