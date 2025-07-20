import { Context } from '@mono/common';
import { syncEmployees, mapProvidersToEmployees, syncUsers } from '../service';

(async function main() {
  const context = await Context.create();
  
  const syncEmployeeResult = await syncEmployees(context);
  if (syncEmployeeResult.isErr()) {
    console.log(`error`, syncEmployeeResult.error);
  } else {
    console.log(`ok`, syncEmployeeResult.value);
  }

  const syncUsersResult = await syncUsers(context);
  if (syncUsersResult.isErr()) {
    console.log(`error`, syncUsersResult.error);
  } else {
    console.log(`ok`, syncUsersResult.value);
  }

  const mappingResult = await mapProvidersToEmployees(context);
  if (mappingResult.isErr()) {
    console.log(`error`, mappingResult.error);
  } else {
    console.log(`ok`, mappingResult.value);
  }
})();
