import { Context } from '@mono/common';
import Billing from '../billing';

(async function main() {
  const context = await Context.create();
  const processResult = await Billing.Service.processAllBillingContracts(context);
  if (processResult.isErr()) {
    console.log(`error`, processResult.error);
  } else {
    console.log(`ok`, processResult.value);
  }
})();
