import { IContext } from '@mono/common/lib/context';
import { ErrCode } from '@mono/common/lib/error';
import { Result, err, ok } from 'neverthrow';
import * as db from 'zapatos/db';
import '@mono/common/lib/zapatos/schema';
import * as zs from 'zapatos/schema';
import { common, telenutrition } from 'zapatos/schema';
import { z } from 'zod';
import _ = require('lodash');
import { RedshiftInvoiceTransactionSchema } from './invoice/service';
import Invoice from './invoice';
import Claim from './claim';
import { RedshiftClaimTransactionSchema } from './claim/service';

const TAG = 'telenutrition.billing.service';
const RECENTLY_INACTIVE_CONTRACT_IN_DAYS = 30;

export type BillingContract = telenutrition.billing_contract.JSONSelectable &
  db.LateralResult<{
    billing_code: db.SQLFragment<
      telenutrition.billing_code.JSONSelectable &
        db.LateralResult<{
          default_rule: db.SQLFragment<telenutrition.billing_rule.JSONSelectable, never>;
        }>,
      never
    >;
    override_rule: db.SQLFragment<telenutrition.billing_rule.JSONSelectable | undefined, never>;
    account: db.SQLFragment<common.account.JSONSelectable, never>;
  }>;

async function getProcessableBillingContractIds(context: IContext): Promise<Result<number[], ErrCode>> {
  const tag = `${TAG}.getProcessableBillingContractIds`;
  const { logger, store } = context;

  try {
    const storePool = await store.reader();

    logger.debug(context, tag, 'fetching contracts');
    const contracts = await db
      .select(
        'telenutrition.billing_contract',
        {
          active_at: db.sql`${db.self} < now()`,
          inactive_at: db.sql`(${db.self} > (now() - INTERVAL '${db.raw(RECENTLY_INACTIVE_CONTRACT_IN_DAYS.toString())} days')) OR ${db.self} IS NULL`,
          inactive: false,
        },
        { columns: ['billing_contract_id'] },
      )
      .run(storePool);

    const contractIds = contracts.map((c) => c.billing_contract_id);
    logger.debug(context, tag, 'fetched contracts', { contractCount: contracts.length });
    return ok(contractIds);
  } catch (e) {
    logger.exception(context, tag, e);
    return err(ErrCode.EXCEPTION);
  }
}

async function getBillingContractById(context: IContext, id: number): Promise<Result<BillingContract, ErrCode>> {
  const tag = `${TAG}.getBillingContractById`;
  const { logger, store } = context;

  try {
    const storePool = await store.reader();

    logger.debug(context, tag, 'fetching contract', { id });
    const contract = await db
      .selectExactlyOne(
        'telenutrition.billing_contract',
        {
          billing_contract_id: id,
        },
        {
          lateral: {
            billing_code: db.selectExactlyOne(
              'telenutrition.billing_code',
              { code_id: db.parent('code_id') },
              {
                lateral: {
                  default_rule: db.selectExactlyOne('telenutrition.billing_rule', {
                    billing_rule_id: db.parent('billing_rule_id'),
                  }),
                },
              },
            ),
            override_rule: db.selectOne('telenutrition.billing_rule', {
              billing_rule_id: db.parent('billing_rule_id'),
            }),
            account: db.selectExactlyOne('common.account', { account_id: db.parent('account_id') }),
          },
        },
      )
      .run(storePool);

    logger.debug(context, tag, 'fetched contract', { id });
    return ok(contract);
  } catch (e) {
    logger.exception(context, tag, e);
    return err(ErrCode.EXCEPTION);
  }
}

async function processAllBillingContracts(context: IContext): Promise<Result<null, ErrCode>> {
  const tag = `${TAG}.processAllBillingContracts`;
  const { logger, store } = context;

  try {
    logger.info(context, tag, `starting to process all contracts`);
    const storePool = await store.writer();

    // Get timestamp for the start time of this flow state
    const startTime = Date.now();

    // Get the contracts to process
    const contractsResult = await getProcessableBillingContractIds(context);
    if (contractsResult.isErr()) {
      logger.error(context, tag, 'error getting contracts to process');
      return err(ErrCode.SERVICE);
    }
    const contractIds = contractsResult.value;
    logger.info(context, tag, `fetched contract ids to process`, { contractIds });

    // Clear processing errors for all rules
    logger.debug(context, tag, 'clearing rules processing errors');
    await db
      .update(
        'telenutrition.billing_rule',
        {
          processing_error: null,
        },
        { processing_error: db.conditions.isNotNull },
      )
      .run(storePool);

    // Process each contract
    for (const contractId of contractIds) {
      await processBillingContract(context, {
        billingContractId: contractId,
        dryRun: false,
        startTime,
      });
    }

    logger.info(context, tag, `finished processing all contracts`, { contractIds });
    return ok(null);
  } catch (e) {
    logger.exception(context, tag, e);
    return err(ErrCode.EXCEPTION);
  }
}

interface ProcessBillingContractParams {
  billingContractId: number;
  dryRun: boolean;
  startTime: number;
}

async function processBillingContract(
  context: IContext,
  params: ProcessBillingContractParams,
): Promise<Result<null, ErrCode>> {
  const tag = `${TAG}.processBillingContract`;
  const { logger, redshift, store } = context;

  try {
    const redshiftPool = await redshift();
    const storePool = await store.writer();
    const { billingContractId, dryRun } = params;

    const contractResult = await getBillingContractById(context, billingContractId);
    if (contractResult.isErr()) {
      return err(ErrCode.NOT_FOUND);
    }
    const contract = contractResult.value;

    logger.info(context, tag, 'start processing contract', params);

    // Build the 'rule query'
    const rule = contract.override_rule ?? contract.billing_code.default_rule;
    const builtQuery = buildBillingRuleQuery(rule.query, {
      billing_contract_id: contract.billing_contract_id,
      billing_contract_active_at: contract.active_at,
      billing_contract_inactive_at: contract.inactive_at,
      billing_contract_rate: contract.rate,
      account_id: contract.account_id,
      account_features: contract.account.features,
    });
    const values = contract.param_values;

    try {
      // Run the ‘rule query’ in redshift to generate new transactions
      logger.info(context, tag, 'running the rule query in redshift', params);
      const redshiftResult = await redshiftPool.query(builtQuery, values);

      if (redshiftResult.rows.length > 0) {
        switch (contract.contract_type) {
          case 'invoice':
            const redshiftInvoices = z.array(RedshiftInvoiceTransactionSchema).parse(redshiftResult.rows);
            await Invoice.Service.processInvoices(context, {
              invoices: redshiftInvoices,
              contract,
              dryRun,
            });
            break;
          case 'claim':
            const redshiftClaims = z.array(RedshiftClaimTransactionSchema).parse(redshiftResult.rows);
            await Claim.Service.processClaims(context, {
              claims: redshiftClaims,
              contract,
              dryRun,
              startTime: params.startTime,
            });
            break;
          default:
            throw new Error('unrecognized contract type');
        }
      } else {
        logger.debug(context, tag, 'no transactions were generated', params);
      }

      // On success, update the contract processed_at timestamp
      await db
        .update(
          'telenutrition.billing_contract',
          {
            processed_at: db.sql`now()`,
          },
          { billing_contract_id: contract.billing_contract_id },
        )
        .run(storePool);
    } catch (e) {
      // On error, persist the error message with the rule
      logger.error(
        context,
        tag,
        'caught error when processing billing contract, persisting the error message in the store.',
        { ...params, error: e.message },
      );
      await db
        .update(
          'telenutrition.billing_rule',
          {
            processing_error: e.message ?? 'An unknown error occurred.',
          },
          { billing_rule_id: rule.billing_rule_id },
        )
        .run(storePool);
    }
    logger.info(context, tag, 'finished processing contract', params);

    return ok(null);
  } catch (e) {
    logger.exception(context, tag, e);
    return err(ErrCode.EXCEPTION);
  }
}

type TestRunBillingContractResult =
  | {
      transactions: zs.telenutrition.billing_transaction.Insertable[];
    }
  | {
      error: string;
    };

/**
 * Runs a single billing contract and returns the transactions (doesn't store them)
 */
async function testRunBillingContract(
  context: IContext,
  contractId: number,
): Promise<Result<TestRunBillingContractResult, ErrCode>> {
  const tag = `${TAG}.testRunBillingContract`;
  const { logger, redshift } = context;

  try {
    const redshiftPool = await redshift();

    const contractResult = await getBillingContractById(context, contractId);
    if (contractResult.isErr()) {
      return err(ErrCode.NOT_FOUND);
    }
    const contract = contractResult.value;

    logger.info(context, tag, 'start test running contract', { contractId });

    // Build the 'rule query'
    const rule = contract.override_rule ?? contract.billing_code.default_rule;
    const builtQuery = buildBillingRuleQuery(rule.query, {
      billing_contract_id: contract.billing_contract_id,
      billing_contract_active_at: contract.active_at,
      billing_contract_inactive_at: contract.inactive_at,
      billing_contract_rate: contract.rate,
      account_id: contract.account_id,
      account_features: contract.account.features,
    });
    const values = contract.param_values;

    try {
      // Run the ‘rule query’ in redshift to generate new transactions
      logger.info(context, tag, 'running the rule query in redshift', { contractId, builtQuery, values });
      const testQuery = `SELECT * FROM (${builtQuery.replace(/;/g, '')}) AS built_query LIMIT 1000;`;
      const redshiftResult = await redshiftPool.query(testQuery, values);

      switch (contract.contract_type) {
        case 'invoice':
          const redshiftInvoices = z.array(RedshiftInvoiceTransactionSchema).parse(redshiftResult.rows);
          const invoiceTransactions = await Invoice.Service.processInvoices(context, {
            invoices: redshiftInvoices,
            contract,
            dryRun: true,
          });
          return ok({ transactions: invoiceTransactions });
        case 'claim':
          const redshiftClaims = z.array(RedshiftClaimTransactionSchema).parse(redshiftResult.rows);
          const claimTransactions = await Claim.Service.processClaims(context, {
            claims: redshiftClaims,
            contract,
            dryRun: true,
          });
          return ok({ transactions: claimTransactions });
        default:
          logger.error(context, tag, 'Invalid contract type', { contractId });
          return err(ErrCode.INVALID_DATA);
      }
    } catch (e) {
      // On error, return the error message
      logger.debug(context, tag, 'caught error when test running billing contract', {
        contractId,
        rule,
        error: e.message,
      });
      return ok({ error: e.message ?? 'An unknown error occurred.' });
    }
  } catch (e) {
    logger.exception(context, tag, e);
    return err(ErrCode.EXCEPTION);
  }
}

export interface DebugBillingContractReport {
  queryReport: DebugBillingContractQueryReport;
  issueQueryReport: DebugBillingContractQueryReport | null;
}

type DebugBillingContractQueryReport =
  | {
      success: true;
      builtQuery: string;
      paramValues: string[];
      queryPlan: string[];
    }
  | {
      success: false;
      builtQuery: string;
      paramValues: string[];
      error: string;
    };

async function debugBillingContract(
  context: IContext,
  billingContractId: number,
): Promise<Result<DebugBillingContractReport, ErrCode>> {
  const tag = `${TAG}.debugBillingContract`;
  const { logger, redshift } = context;

  try {
    const redshiftPool = await redshift();

    const contractResult = await getBillingContractById(context, billingContractId);
    if (contractResult.isErr()) {
      return err(ErrCode.NOT_FOUND);
    }
    const contract = contractResult.value;

    const rule = contract.override_rule ?? contract.billing_code.default_rule;

    let queryReport: DebugBillingContractQueryReport | null = null;
    const builtQuery = buildBillingRuleQuery(rule.query, {
      billing_contract_id: contract.billing_contract_id,
      billing_contract_active_at: contract.active_at,
      billing_contract_inactive_at: contract.inactive_at,
      billing_contract_rate: contract.rate,
      account_id: contract.account_id,
      account_features: contract.account.features,
    });
    const paramValues = contract.param_values;

    try {
      // Using EXPLAIN so redshift will create a query plan without actually executing the query
      const testQuery = `EXPLAIN ${builtQuery}`;
      logger.debug(context, tag, 'query test sql', { testQuery, paramValues });
      const redshiftResult = await redshiftPool.query(testQuery, paramValues);
      queryReport = {
        success: true,
        builtQuery,
        paramValues,
        queryPlan: redshiftResult.rows.map((row) => row['QUERY PLAN']) as string[],
      };
    } catch (e) {
      queryReport = {
        success: false,
        builtQuery,
        paramValues,
        error: e.message ?? 'An unknown error occured.',
      };
    }

    let issueQueryReport: DebugBillingContractQueryReport | null = null;
    if (rule.issue_query) {
      const builtQuery = buildBillingRuleQuery(rule.issue_query, {
        billing_contract_id: contract.billing_contract_id,
        billing_contract_active_at: contract.active_at,
        billing_contract_inactive_at: contract.inactive_at,
        billing_contract_rate: contract.rate,
        account_id: contract.account_id,
        account_features: contract.account.features,
      });

      try {
        // Using EXPLAIN so redshift will create a query plan without actually executing the query
        const testQuery = `EXPLAIN ${builtQuery}`;
        logger.debug(context, tag, 'issue query test sql', { testQuery, paramValues });
        const redshiftResult = await redshiftPool.query(testQuery, paramValues);
        issueQueryReport = {
          success: true,
          builtQuery,
          paramValues,
          queryPlan: redshiftResult.rows.map((row) => row['QUERY PLAN']) as string[],
        };
      } catch (e) {
        issueQueryReport = {
          success: false,
          builtQuery,
          paramValues,
          error: e.message ?? 'An unknown error occured.',
        };
      }
    }

    return ok({ queryReport, issueQueryReport });
  } catch (e) {
    logger.exception(context, tag, e);
    return err(ErrCode.EXCEPTION);
  }
}

type BillingRuleContext = {
  billing_contract_id: number;
  billing_contract_active_at: string;
  billing_contract_inactive_at: string | null;
  billing_contract_rate: string;
  account_id: number;
  account_features: string[] | null;
};

export function buildBillingRuleQuery(query: string, context: BillingRuleContext): string {
  return query
    .replace(/:billing_contract_id/g, context.billing_contract_id.toString())
    .replace(/:billing_contract_active_at/g, `'${context.billing_contract_active_at}'::timestamp`)
    .replace(/:billing_contract_inactive_at/g, `'${context.billing_contract_inactive_at ?? 'infinity'}'::timestamp`)
    .replace(/:billing_contract_rate/g, `'${context.billing_contract_rate}'::money`)
    .replace(/:account_id/g, context.account_id.toString())
    .replace(
      /:account_features/g,
      JSON.stringify(context.account_features ?? [])
        .replace('[', `'{`)
        .replace(']', `}'::text[]`),
    );
}

const BillingContractIssueSchema = z
  .object({
    reason: z.string(),
  })
  .passthrough();

type BillingContractIssue = z.infer<typeof BillingContractIssueSchema>;

async function getBillingContractIssues(
  context: IContext,
  billingContractId: number,
): Promise<Result<BillingContractIssue[], ErrCode>> {
  const tag = `${TAG}.getBillingContractIssues`;
  const { logger, redshift } = context;

  try {
    const redshiftPool = await redshift();

    const contractResult = await getBillingContractById(context, billingContractId);
    if (contractResult.isErr()) {
      return err(ErrCode.NOT_FOUND);
    }
    const contract = contractResult.value;

    const rule = contract.override_rule ?? contract.billing_code.default_rule;
    if (!rule.issue_query) {
      logger.info(context, tag, 'billing contract has no issue query to run');
      return err(ErrCode.INVALID_DATA);
    }

    const builtQuery = buildBillingRuleQuery(rule.issue_query, {
      billing_contract_id: contract.billing_contract_id,
      billing_contract_active_at: contract.active_at,
      billing_contract_inactive_at: contract.inactive_at,
      billing_contract_rate: contract.rate,
      account_id: contract.account_id,
      account_features: contract.account.features,
    });
    const values = contract.param_values;

    const limitedQuery = `SELECT * FROM (${builtQuery.replace(/;/g, '')}) AS built_query LIMIT 1000;`;

    const queryResult = await redshiftPool.query(limitedQuery, values);

    const parseResult = z.array(BillingContractIssueSchema).safeParse(queryResult.rows);
    if (!parseResult.success) {
      logger.info(context, tag, 'failed to parse issue query result');
      return err(ErrCode.INVALID_DATA);
    }

    return ok(parseResult.data);
  } catch (e) {
    logger.exception(context, tag, e);
    return err(ErrCode.EXCEPTION);
  }
}

type ValidateInvoicedAtParams = {
  invoicedAt: Date;
  contractActiveAt: Date;
  contractInactiveAt?: Date;
};

export function validateInvoicedAt(context: IContext, params: ValidateInvoicedAtParams): void {
  const { invoicedAt, contractActiveAt, contractInactiveAt } = params;
  const isTransactionWithinContractActiveDateRange =
    invoicedAt > contractActiveAt && (contractInactiveAt === undefined || invoicedAt < contractInactiveAt);
  if (!isTransactionWithinContractActiveDateRange) {
    throw Error('Rule query generated a transaction with an invoiced_at outside the contract active date range.');
  }
}

export default {
  processAllBillingContracts,
  testRunBillingContract,
  debugBillingContract,
  getBillingContractIssues,
};
