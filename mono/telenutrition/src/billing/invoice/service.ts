import { IContext } from '@mono/common/lib/context';
import * as db from 'zapatos/db';
import '@mono/common/lib/zapatos/schema';
import * as zs from 'zapatos/schema';
import { z } from 'zod';
import _ = require('lodash');
import Decimal from 'decimal.js';
import { BillingContract, validateInvoicedAt } from '../service';

const TAG = 'telenutrition.billing.service.invoice';

export const RedshiftInvoiceTransactionSchema = z
  .object({
    identity_id: z.number().int(),
    invoiced_at: z.date(),
  })
  .passthrough();
export type RedshiftInvoiceTransaction = z.infer<typeof RedshiftInvoiceTransactionSchema>;

export interface ProcessInvoicesParams {
  invoices: RedshiftInvoiceTransaction[];
  contract: BillingContract;
  dryRun: boolean;
}

async function processInvoices(
  context: IContext,
  params: ProcessInvoicesParams,
): Promise<zs.telenutrition.billing_transaction.Insertable[]> {
  const tag = `${TAG}.processInvoices`;
  const { logger, store } = context;
  const storePool = await store.writer();

  const transactionsToInsert: zs.telenutrition.billing_transaction.Insertable[] = params.invoices.map((t) => {
    validateInvoicedAt(context, {
      invoicedAt: t.invoiced_at,
      contractActiveAt: new Date(params.contract.active_at),
      contractInactiveAt: params.contract.inactive_at ? new Date(params.contract.inactive_at) : undefined,
    });

    const { invoiced_at, identity_id, ...meta } = t;

    const insertable: zs.telenutrition.billing_transaction.Insertable = {
      identity_id: identity_id,
      invoiced_at: invoiced_at,
      billing_contract_id: params.contract.billing_contract_id,
      code_id: params.contract.code_id,
      account_id: params.contract.account_id,
      transaction_type: params.contract.contract_type,
      charge_amount_cents: new Decimal(params.contract.rate.replace('$', '')).times(100).toNumber(),
      meta: meta as db.JSONValue | db.Parameter<db.JSONValue> | null | db.DefaultType | db.SQLFragment,
    };
    return insertable;
  });

  if (params.dryRun === false) {
    for (const transactionChunk of _.chunk(transactionsToInsert, 500)) {
      logger.debug(context, tag, 'persisting generated invoice transaction chunk in the store', {
        contractId: params.contract.billing_contract_id,
        transactionChunkCount: transactionChunk.length,
      });
      await db.insert('telenutrition.billing_transaction', transactionChunk).run(storePool);
    }
  }

  return transactionsToInsert;
}

export default {
  processInvoices,
};
