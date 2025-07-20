import { IContext } from '@mono/common/lib/context';
import * as db from 'zapatos/db';
import '@mono/common/lib/zapatos/schema';
import * as zs from 'zapatos/schema';
import { z } from 'zod';
import { CandidApi, CandidApiClient, CandidApiEnvironment } from 'candidhealth';
import { ProcedureModifier } from 'candidhealth/api';
import _ = require('lodash');
import { BillingContract, validateInvoicedAt } from '../service';

const TAG = 'telenutrition.billing.service.claim';
const MAX_FLOW_RUNTIME_HOURS = 8;

const JsonParseSchema = z.string().transform((val, ctx) => {
  try {
    return JSON.parse(val);
  } catch (e) {
    ctx.addIssue({ code: 'custom', message: 'Invalid JSON string.' });
    return z.NEVER;
  }
});

export const TransactionBaseSchema = z.object({
  identity_id: z.number().int(),
  invoiced_at: z.date(),
});

const CandidDateSchema = z
  .string()
  .regex(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/)
  .transform((v) => CandidApi.Date_(v));

const ClaimTransactionMetaBaseSchema = z.object({
  external_id: z.string().transform((v) => CandidApi.EncounterExternalId(v)),
  date_of_service: CandidDateSchema,
  billable_status: z.nativeEnum(CandidApi.encounters.v4.BillableStatusType),
  responsible_party: z.nativeEnum(CandidApi.encounters.v4.ResponsiblePartyType),
  patient_authorized_release: z.boolean(),
  benefits_assigned_to_provider: z.boolean(),
  provider_accepts_assignment: z.boolean(),
  patient_first_name: z.string(),
  patient_last_name: z.string(),
  patient_gender: z.nativeEnum(CandidApi.Gender),
  patient_external_id: z.string(),
  patient_date_of_birth: CandidDateSchema,
  patient_address_address1: z.string(),
  patient_address_address2: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val ?? undefined),
  patient_address_city: z.string(),
  patient_address_state: z.nativeEnum(CandidApi.State),
  patient_address_zip_code: z.string(),
  billing_provider_organization_name: z.string(),
  billing_provider_address_address1: z.string(),
  billing_provider_address_address2: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val ?? undefined),
  billing_provider_address_city: z.string(),
  billing_provider_address_state: z.nativeEnum(CandidApi.State),
  billing_provider_address_zip_code: z.string(),
  billing_provider_address_zip_plus_four_code: z.string(),
  billing_provider_tax_id: z.string().regex(/^([0-9]{9})|([0-9]{3}-[0-9]{2}-[0-9]{4})|([0-9]{2}-[0-9]{7})$/),
  billing_provider_npi: z.string(),
  rendering_provider_npi: z.string(),
  rendering_provider_first_name: z.string(),
  rendering_provider_last_name: z.string(),
  rendering_provider_taxonomy_code: z.string().optional(),
  service_facility_organization_name: z.string(),
  service_facility_address_address1: z.string(),
  service_facility_address_address2: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val ?? undefined),
  service_facility_address_city: z.string(),
  service_facility_address_state: z.nativeEnum(CandidApi.State),
  service_facility_address_zip_code: z.string(),
  service_facility_address_zip_plus_four_code: z.string(),
  subscriber_primary_first_name: z.string(),
  subscriber_primary_last_name: z.string(),
  subscriber_primary_gender: z.nativeEnum(CandidApi.Gender),
  subscriber_primary_patient_relationship_to_subscriber_code: z.nativeEnum(
    CandidApi.PatientRelationshipToInsuredCodeAll,
  ),
  subscriber_primary_date_of_birth: CandidDateSchema.nullable()
    .optional()
    .transform((val) => val ?? undefined),
  subscriber_primary_insurance_card_member_id: z.string(),
  subscriber_primary_insurance_card_payer_name: z.string(),
  subscriber_primary_insurance_card_payer_id: z.string(),
  place_of_service_code: z.nativeEnum(CandidApi.FacilityTypeCode),
});

const ClaimTransactionMetaV1Schema = ClaimTransactionMetaBaseSchema.extend({
  schema_type: z.literal('claim_v1'),
  diagnoses_code_type: z.nativeEnum(CandidApi.DiagnosisTypeCode),
  diagnoses_code: z.string(),
  service_lines_modifiers: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val ?? undefined),
  service_lines_procedure_code: z.string(),
  service_lines_quantity: z.string().transform((v) => CandidApi.Decimal(v)),
  service_lines_units: z.nativeEnum(CandidApi.ServiceLineUnits),
  service_lines_charge_amount_cents: z.number().int(),
})

const ClaimTransactionMetaV2Schema = ClaimTransactionMetaBaseSchema.extend({
  schema_type: z.literal('claim_v2'),
  diagnoses: JsonParseSchema.pipe(
    z.array(
      z.object({
        code_type: z.nativeEnum(CandidApi.DiagnosisTypeCode),
        code: z.string(),
      }),
    ),
  ),
  service_lines: JsonParseSchema.pipe(
    z.array(
      z.object({
        external_id: z
          .string()
          .nullable()
          .optional()
          .transform((val) => val ?? undefined),
        procedure_code: z.string(),
        quantity: z.string().transform((v) => CandidApi.Decimal(v)),
        units: z.nativeEnum(CandidApi.ServiceLineUnits),
        diagnosis_pointers: z.array(z.number().int()).min(1),
        modifiers: z
          .array(z.string())
          .nullable()
          .optional()
          .transform((val) => val ?? undefined),
        charge_amount_cents: z.number().int(),
      }),
    ),
  ),
})

export const RedshiftClaimTransactionSchema = z.preprocess(
  (val) => {
    if (val !== null && typeof val === 'object' && !('schema_type' in val)) {
      return { schema_type: 'claim_v1', ...val };
    }
    return val;
  },
  z.discriminatedUnion('schema_type', [
    ClaimTransactionMetaV1Schema.merge(TransactionBaseSchema).passthrough(),
    ClaimTransactionMetaV2Schema.merge(TransactionBaseSchema).passthrough(),
  ]),
);
export type RedshiftClaimTransaction = z.infer<typeof RedshiftClaimTransactionSchema>;

export interface ProcessClaimsParams {
  claims: RedshiftClaimTransaction[];
  contract: BillingContract;
  dryRun: boolean;
  startTime?: number; // Optional start time, used for limiting retries to avoid running too long
}

async function processClaims(context: IContext, params: ProcessClaimsParams) {
  const tag = `${TAG}.processClaims`;
  const { logger, store } = context;
  const storePool = await store.writer();
  const { host, clientId, clientSecret } = context.config.telenutrition.candidhealth;
  const candidClient = new CandidApiClient({
    environment: host as CandidApiEnvironment,
    clientId,
    clientSecret,
  });

  const contractId = params.contract.billing_contract_id;

  const resultTransactions: zs.telenutrition.billing_transaction.Insertable[] = [];
  for (const t of params.claims) {
    validateInvoicedAt(context, {
      invoicedAt: t.invoiced_at,
      contractActiveAt: new Date(params.contract.active_at),
      contractInactiveAt: params.contract.inactive_at ? new Date(params.contract.inactive_at) : undefined,
    });

    let diagnoses: CandidApi.DiagnosisCreate[];
    let serviceLines: CandidApi.serviceLines.v2.ServiceLineCreate[];
    let chargeAmountCents: number;
    switch (t.schema_type) {
      case 'claim_v1':
        diagnoses = [
          {
            codeType: t.diagnoses_code_type,
            code: t.diagnoses_code,
          },
        ];
        serviceLines = [
          {
            procedureCode: t.service_lines_procedure_code,
            quantity: t.service_lines_quantity,
            units: t.service_lines_units,
            diagnosisPointers: [0],
            modifiers: t.service_lines_modifiers ? ([t.service_lines_modifiers] as ProcedureModifier[]) : undefined,
            chargeAmountCents: t.service_lines_charge_amount_cents,
          },
        ];
        chargeAmountCents = t.service_lines_charge_amount_cents;
        break;
      case 'claim_v2':
        diagnoses = t.diagnoses.map((d) => ({
          codeType: d.code_type,
          code: d.code,
        }));
        serviceLines = t.service_lines.map((sl) => ({
          procedureCode: sl.procedure_code,
          quantity: sl.quantity,
          units: sl.units,
          chargeAmountCents: sl.charge_amount_cents,
          diagnosisPointers: sl.diagnosis_pointers,
          modifiers: sl.modifiers as ProcedureModifier[] | undefined,
        }));
        chargeAmountCents = _.sumBy(t.service_lines, (sl) => sl.charge_amount_cents);
        break;
      default:
        throw new Error('Unhandled schema version');
    }

    if (params.dryRun === true) {
      const { invoiced_at, identity_id, ...meta } = t;
      const testTransaction: zs.telenutrition.billing_transaction.Insertable = {
        billing_contract_id: params.contract.billing_contract_id,
        identity_id: t.identity_id,
        invoiced_at: t.invoiced_at,
        code_id: params.contract.code_id,
        account_id: params.contract.account_id,
        transaction_type: params.contract.contract_type,
        charge_amount_cents: chargeAmountCents,
        meta: meta as db.JSONValue | db.Parameter<db.JSONValue> | null | db.DefaultType | db.SQLFragment,
        transaction_key: t.external_id,
      };
      resultTransactions.push(testTransaction);
      continue;
    }

    const createEncounterRequest = {
      externalId: t.external_id,
      dateOfService: t.date_of_service,
      patientAuthorizedRelease: t.patient_authorized_release,
      benefitsAssignedToProvider: t.benefits_assigned_to_provider,
      providerAcceptsAssignment: t.provider_accepts_assignment,
      billableStatus: t.billable_status,
      responsibleParty: t.responsible_party,
      patient: {
        externalId: t.patient_external_id,
        firstName: t.patient_first_name,
        lastName: t.patient_last_name,
        dateOfBirth: t.patient_date_of_birth,
        gender: t.patient_gender,
        address: {
          address1: t.patient_address_address1,
          address2: t.patient_address_address2,
          city: t.patient_address_city,
          state: t.patient_address_state,
          zipCode: t.patient_address_zip_code,
        },
      },
      billingProvider: {
        organizationName: t.billing_provider_organization_name,
        address: {
          address1: t.billing_provider_address_address1,
          address2: t.billing_provider_address_address2,
          city: t.billing_provider_address_city,
          state: t.billing_provider_address_state,
          zipCode: t.billing_provider_address_zip_code,
          zipPlusFourCode: t.billing_provider_address_zip_plus_four_code,
        },
        npi: t.billing_provider_npi,
        taxId: t.billing_provider_tax_id,
      },
      renderingProvider: {
        firstName: t.rendering_provider_first_name,
        lastName: t.rendering_provider_last_name,
        npi: t.rendering_provider_npi,
        taxonomyCode: t.rendering_provider_taxonomy_code,
      },
      serviceFacility: {
        organizationName: t.service_facility_organization_name,
        address: {
          address1: t.service_facility_address_address1,
          address2: t.service_facility_address_address2,
          city: t.service_facility_address_city,
          state: t.service_facility_address_state,
          zipCode: t.service_facility_address_zip_code,
          zipPlusFourCode: t.service_facility_address_zip_plus_four_code,
        },
      },
      subscriberPrimary: {
        firstName: t.subscriber_primary_first_name,
        lastName: t.subscriber_primary_last_name,
        gender: t.subscriber_primary_gender,
        patientRelationshipToSubscriberCode: t.subscriber_primary_patient_relationship_to_subscriber_code,
        dateOfBirth: t.subscriber_primary_date_of_birth,
        insuranceCard: {
          memberId: t.subscriber_primary_insurance_card_member_id,
          payerName: t.subscriber_primary_insurance_card_payer_name,
          payerId: t.subscriber_primary_insurance_card_payer_id,
        },
      },
      placeOfServiceCode: t.place_of_service_code,
      diagnoses,
      serviceLines,
    };

    let createEncounterResponse = await candidClient.encounters.v4.create(createEncounterRequest);
    let loggedRuntimeCap = false;

    /* Check if we got a 500 or 502 error from Candid that necesitates a retry, e.g.:
       500: {"content":{"reason":"status-code","statusCode":500,"body":{"detail":"Internal server error"}}}
       502: {"content":{"reason":"non-json","statusCode":502,"rawBody":"\n<html><head>\n<meta http-equiv=\"content-type\" 
             content=\"text/html;charset=utf-8\">\n<title>502 Server Error</title>\n</head>\n<body text=#000000 bgcolor=#ffffff>\n<h1>
             Error: Server Error</h1>\n<h2>The server encountered a temporary error and could not complete your request.<p>
             Please try again in 30 seconds.</h2>\n<h2></h2>\n</body></html>\n"}} */
    if (params.startTime && !createEncounterResponse.ok) {
      // Skip retries if we've hit the maximum runtime
      if (Date.now() - params.startTime > MAX_FLOW_RUNTIME_HOURS * 60 * 60 * 1000) {
        //only log the first time we hit the cap, to avoid spamming the logs
        if (!loggedRuntimeCap) {
          const maxRuntimeMessage =
            `Exceeded maximum runtime of ${MAX_FLOW_RUNTIME_HOURS} hours, skipping retries for the rest of the flow`;
          logger.warn(context, tag, maxRuntimeMessage, { contractId, transaction: t });
          loggedRuntimeCap = true;
        }
      } else {
        const retryWithExponentialBackoff = async (): Promise<void> => {
          const maxRetries = 5;
          const baseDelayMs = 30 * 1000;
          let retries = 0;

          const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

          logger.info(context, tag, `Received error from candidClient.encounters.v4.create() for contract ${contractId}`, { response: createEncounterResponse });

          while (retries < maxRetries) {
            retries++;

            if (!createEncounterResponse.ok && createEncounterResponse.error?.content && 'reason' in createEncounterResponse.error?.content
              && (createEncounterResponse.error.content?.reason === 'status-code' || createEncounterResponse.error.content?.reason === 'non-json')
              && [500, 502].includes(createEncounterResponse.error.content.statusCode)) {
              // Calculate exponential backoff delay time for this round (double previous round's delay)
              const delayTime = baseDelayMs * Math.pow(2, retries - 1);

              let sleepMessage =
                `Retry ${retries}/${maxRetries}: Waiting ${delayTime / 1000} seconds before retrying candidClient.encounters.v4.create() for contract ${contractId}`;
              logger.info(context, tag, sleepMessage, { contractId, transaction: t });

              await delay(delayTime);

              let retryMessage =
                `Retrying candidClient.encounters.v4.create() for contract ${contractId} due to error ${createEncounterResponse['error'].content.statusCode} (Attempt ${retries}/${maxRetries})`;
              logger.info(context, tag, retryMessage, { contractId, transaction: t });

              // Retry the create() encounter call
              createEncounterResponse = await candidClient.encounters.v4.create(createEncounterRequest);

              let retryResponse =
                `Retry response from candidClient.encounters.v4.create() for contract ${contractId} on retry attempt ${retries}: ` + JSON.stringify(createEncounterResponse);
              logger.info(context, tag, retryResponse, { contractId, transaction: t });
            }

            // If we keep getting 500/502 errors, attempt retries
            if (!createEncounterResponse.ok && createEncounterResponse.error?.content && 'reason' in createEncounterResponse.error?.content
              && (createEncounterResponse.error.content?.reason === 'status-code' || createEncounterResponse.error.content?.reason === 'non-json')
              && [500, 502].includes(createEncounterResponse.error.content.statusCode)) {
              const retryFailedMessage = `Received error ${createEncounterResponse['error'].content.statusCode} from create encounter for contract ${contractId} on retry attempt ${retries}`;
              logger.warn(context, tag, retryFailedMessage, { contractId, transaction: t });
            } else if (!createEncounterResponse.ok
              && createEncounterResponse.error?.errorName === 'EncounterExternalIdUniquenessError') {
              // If we got an EncounterExternalIdUniquenessError, that means it was actually successful on Candid's end e.g.:
              // {"content":{"externalId":"athena:123456"},"errorName":"EncounterExternalIdUniquenessError"}

              let externalIdUniquenessMessage =
                `EncounterExternalIdUniquenessError received from candidClient.encounters.v4.create() for contract ${contractId} on retry attempt ${retries}`;
              logger.info(context, tag, externalIdUniquenessMessage, { contractId, transaction: t });

              const externalId = createEncounterResponse.error.content?.externalId as CandidApi.EncounterExternalId;

              // First check if the externalId returned in the candid uniqueness error matches what we passed in (should never happen)
              if (externalId !== t.external_id) {
                const externalIdMismatchMessage =
                  `ExternalId from Candid's EncounterExternalIdUniquenessError mismatch for contract ${contractId}: expected ${t.external_id}, got ${externalId}`;
                logger.error(context, tag, externalIdMismatchMessage, { contractId, transaction: t });
                return;
              }

              // check the postgres "store" for externalId, if found we can just skip to the next encounter (super rare case)
              const matchingTransactions = await db
                .select('telenutrition.billing_transaction', {
                  transaction_key: externalId.toString()
                })
                .run(storePool);

              if (matchingTransactions.length > 0) {
                createEncounterResponse.error.errorName += ' - ExternalId already exists in store as well';

                let externalIdInStoreMessage =
                  `externalId '${externalId}' already exists in store, setting createEncounterResponse appropriately`;
                logger.info(context, tag, externalIdInStoreMessage, { contractId, transaction: t });

                return;
              }

              // if it's not in the store, we can try to get the encounter from Candid and then add it to the store
              let getEncountersResponse = await candidClient.encounters.v4.getAll({ externalId });

              if (getEncountersResponse.ok && getEncountersResponse.body.items.length === 1) {
                let candidHasExternalIdMessage =
                  `externalId '${externalId}' already exists in Candid, setting createEncounterResponse appropriately`;
                logger.info(context, tag, candidHasExternalIdMessage, { contractId, transaction: t });

                createEncounterResponse = { ok: true, body: getEncountersResponse.body.items[0] };
                return;
              } else {
                // If the candid response is not an 'ok' with exactly one encounter, log an unexpected error
                let unexpectedError =
                  'Unexpected error while trying to get encounter from Candid after EncounterExternalIdUniquenessError: ';

                if (!getEncountersResponse.ok) {
                  unexpectedError += JSON.stringify(getEncountersResponse.error);
                } else if (getEncountersResponse.body.items.length !== 1) {
                  unexpectedError += `Expected 1 encounter, got ${getEncountersResponse.body.items.length}`;
                }

                logger.error(context, tag, unexpectedError, { contractId, transaction: t });
                return;
              }
            } else {
              // We did not encounter a 500/502 error or an EncounterExternalIdUniquenessError, so we can break out of the retry loop
              let noFurtherRetriesMessage = `No further retries for candidClient.encounters.v4.create() for this transaction in contract ${contractId}`;
              logger.info(context, tag, noFurtherRetriesMessage, { contractId, transaction: t });

              return;
            }
          }

          let maxRetriesMessage =
            `Max retries reached (${maxRetries}) by candidClient.encounters.v4.create() for contract ${contractId}`;
          logger.error(context, tag, maxRetriesMessage, { contractId, transaction: t });
        };

        await retryWithExponentialBackoff();
      }
    }

    if (createEncounterResponse.ok) {
      const { body: newEncounter } = createEncounterResponse;
      const { invoiced_at, identity_id, ...meta } = t;

      const externalId = typeof meta.external_id === 'string' && meta.external_id.trim() !== ''
        ? meta.external_id
        : undefined;

      const transactionToStore: zs.telenutrition.billing_transaction.Insertable = {
        identity_id,
        invoiced_at,
        billing_contract_id: params.contract.billing_contract_id,
        code_id: params.contract.code_id,
        account_id: params.contract.account_id,
        transaction_type: params.contract.contract_type,
        charge_amount_cents: chargeAmountCents,
        meta: {
          ...meta,
          newEncounter: JSON.parse(JSON.stringify(newEncounter)),
        } as any,
        transaction_key: externalId,
      };

      try {
        await db.insert('telenutrition.billing_transaction', [transactionToStore]).run(storePool);
        resultTransactions.push(transactionToStore);
        logger.info(context, tag, `successfully processed claim`, { contractId, externalId: t.external_id });
      } catch (e) {
        logger.error(context, tag, 'error persisting claim transaction', { contractId, transactionToStore });
        throw e;
      }
    } else {
      const error =
        `Error processing claim for contract ${contractId}: ` + JSON.stringify(createEncounterResponse.error);
      logger.error(context, tag, error, { contractId, transaction: t });
      throw new Error(error);
    }
  }
  return resultTransactions;
}

export default {
  processClaims,
};
