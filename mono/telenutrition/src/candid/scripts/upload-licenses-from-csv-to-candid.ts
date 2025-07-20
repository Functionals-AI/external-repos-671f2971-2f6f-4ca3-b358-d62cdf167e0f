import { Context } from '@mono/common'
import { uploadLicensesFromCsvToCandid } from '../upload/licenses';


(async function main() {
  const args = process.argv.slice(2);
  if (args.length != 3) {
    console.log('Please provide the following arguments: <filePath> <payerId> <payerName>')
    return;
  }
  const filePath = args[0];
  const payerId = args[1];
  const payerName = args[2];

  const context = await Context.create();
  const syncResult = await uploadLicensesFromCsvToCandid(context, filePath, payerId, payerName);
  if (syncResult.isErr()) {
    console.log(`error`, syncResult.error)
  } else {
    console.log(`ok`, syncResult.value)
  }
})();
