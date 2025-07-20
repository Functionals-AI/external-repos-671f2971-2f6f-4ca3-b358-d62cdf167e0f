import { Context } from "..";
import Okta from '../integration/okta'
import { OKTA_KEY_ALIAS } from "../integration/okta/service";

(async function main() {
  const context = await Context.create()

  const result = await Okta.Service.exportJwk(context, OKTA_KEY_ALIAS)

  if (result.isOk()) {
    console.log(JSON.stringify(result.value, null, 2))
  } else {
    console.error('export error', { errCode: result.error })
  }
})()