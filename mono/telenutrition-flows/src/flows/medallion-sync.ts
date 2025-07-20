import { ok, err } from 'neverthrow'
import { workflow, task } from '@mono/common-flows/lib/builder'
import { IContext } from '@mono/common/lib/context';
import Medallion from '@mono/telenutrition/lib/medallion';

enum State {
  SyncProviders = 'SyncProviders',
  SyncLicenses = 'SyncLicenses',
  SyncBoardCertificates = 'SyncBoardCertificates',
}

export default workflow(function (config) {
  if (config.isProduction) {
    return {
      rate: '1 day',
      startAt: State.SyncProviders,
      states: {
        [State.SyncProviders]: task({
          handler: async (context: IContext) => {
            const result = await Medallion.Sync.syncProvidersFromMedallion(context);
            if (result.isErr()) {
              return err(result.error)
            }
            return ok(result.value as any);
          },
          next: State.SyncLicenses
        }),
        [State.SyncLicenses]: task({
          handler: async (context: IContext) => {
            const result = await Medallion.Sync.syncLicensesFromMedallion(context);
            if (result.isErr()) {
              return err(result.error)
            }
            return ok(result.value as any);
          },
          next: State.SyncBoardCertificates
        }),
        [State.SyncBoardCertificates]: task({
          handler: async (context: IContext) => {
            const result = await Medallion.Sync.syncBoardCertificatesFromMedallion(context);
            if (result.isErr()) {
              return err(result.error)
            }
            return ok(result.value as any);
          },
        }),
      }
    }
  }
});
