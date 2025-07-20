import { IContext } from '@mono/common/lib/context';
import { ProcessClaimsParams, RedshiftClaimTransaction } from './service';
import Claim from '../claim';
import { BillingContract } from '../service';
import * as zs from 'zapatos/schema';
import { Pool } from 'pg';

const LOGGING_ON = false;

//mock setTimeout to avoid waiting for retry delays
jest.spyOn(global, 'setTimeout').mockImplementation((cb) => {
    cb();
    return {} as NodeJS.Timeout;
});

//mock candidhealth api client
let mockCreate = jest.fn().mockImplementation((...args) => {
    if (LOGGING_ON) console.log('mockCreate called with args:', args);
    return Promise.resolve({ ok: true, body: {} });
});

let mockGetAll = jest.fn().mockImplementation((...args) => {
    if (LOGGING_ON) console.log('mockGetAll called with args:', args);
    return Promise.resolve({ ok: true, body: {} });
});

jest.mock('candidhealth', () => {
    return {
        CandidApi: {
            EncounterExternalId: jest.fn().mockReturnValue('external-1'),
            encounters: {
                v4: {},
            },
        },
        CandidApiClient: jest.fn().mockImplementation(() => ({
            encounters: {
                v4: {
                    create: mockCreate,
                    getAll: mockGetAll,
                },
            },
        }))
    };
});

//mock db
let mockInsert = jest.fn().mockImplementation((...args) => {
    if (LOGGING_ON) console.log('mockInsert called with args:', args);
    return Promise.resolve({ rows: [] });
});

let mockSelect = jest.fn().mockImplementation((...args) => {
    if (LOGGING_ON) console.log('mockSelect called with args:', args);
    return Promise.resolve({ rows: [] });
});

jest.mock('zapatos/db', () => {
    return {
        insert: jest.fn().mockImplementation(() => ({
            run: mockInsert,
        })),
        select: jest.fn().mockImplementation(() => ({
            run: mockSelect,
        })),
        param: jest.fn().mockReturnValue({}),
        sql: jest.fn().mockReturnValue({}),
    };
});

//mock pg
jest.mock('pg', () => {
    return {
        Pool: jest.fn(),
    };
});

const mockContext = {
    logger: {
        info: jest.fn((context, tag, message, meta) => {
            if (LOGGING_ON) console.log(message);
        }),
        warn: jest.fn((context, tag, message, meta) => {
            if (LOGGING_ON) console.log(message);
        }),
        error: jest.fn((context, tag, message, meta) => {
            if (LOGGING_ON) console.log(message);
        }),
        fatal: jest.fn((context, tag, message, meta) => {
            if (LOGGING_ON) console.log(message);
        }),
        debug: jest.fn((context, tag, message, meta) => {
            if (LOGGING_ON) console.log(message);
        }),
        trace: jest.fn((context, tag, message, meta) => {
            if (LOGGING_ON) console.log(message);
        }),
        exception: jest.fn((context, tag, message, meta) => {
            if (LOGGING_ON) console.log(message);
        }),
        tag: jest.fn((context, tag, message, meta) => {
            if (LOGGING_ON) console.log(message);
        })
    },
    store: {
        writer: jest.fn().mockResolvedValue({}),
        reader: jest.fn().mockResolvedValue({} as Pool)
    },
    config: {
        telenutrition: {
            candidhealth: {
                host: 'test-host',
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
            }
        }
    }
} as unknown as IContext;

const mockBillingContract: BillingContract = {
    billing_contract_id: 1,
    code_id: '1',
    account_id: 1,
    contract_type: 'test',
    active_at: '2024-01-01T00:00',
    inactive_at: null,
    rate: '100',
    created_at: '2024-01-01T00:00',
    billing_rule_id: 1,
    param_values: [],
    processed_at: '2024-01-01T00:00',
    inactive: false,
    billing_code: {} as any,
    override_rule: {} as any,
    account: {} as any,
};

const mockClaims = [
    {
        identity_id: 1,
        invoiced_at: new Date('2024-10-24'),
        billing_contract_id: 1,
        code_id: '1',
        account_id: 1,
        transaction_type: 'test',
        service_lines_charge_amount_cents: 1000,
        patient_external_id: 'patient-1',
        schema_type: 'claim_v1',
        external_id: 'external-1',
        date_of_service: new Date('2024-10-24'),
    },
] as unknown as RedshiftClaimTransaction[];

let mockResultTransactions = [
    {
        billing_contract_id: 1,
        identity_id: 1,
        invoiced_at: new Date('2024-10-24'),
        charge_amount_cents: 1000,
        code_id: '1',
        account_id: 1,
        transaction_type: 'test',
        meta: {
            billing_contract_id: 1,
            code_id: '1',
            account_id: 1,
            transaction_type: 'test',
            patient_external_id: 'patient-1',
            service_lines_charge_amount_cents: 1000,
            schema_type: 'claim_v1',
            external_id: 'external-1',
            date_of_service: new Date('2024-10-24'),
        },
        transaction_key: 'external-1',
    }
] as unknown as zs.telenutrition.billing_transaction.Insertable[];

describe('processClaims', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockCreate = jest.fn().mockImplementation((...args) => {
            if (LOGGING_ON) console.log('mockCreate called with args:', args);
            return Promise.resolve({ ok: true, body: {} });
        });

        mockGetAll = jest.fn().mockImplementation((...args) => {
            if (LOGGING_ON) console.log('mockGetAll called with args:', args);
            return Promise.resolve({ ok: true, body: {} });
        });

        mockInsert = jest.fn().mockImplementation((...args) => {
            if (LOGGING_ON) console.log('mockInsert called with args:', args);
            return Promise.resolve({ rows: [] });
        });

        mockSelect = jest.fn().mockImplementation((...args) => {
            if (LOGGING_ON) console.log('mockSelect called with args:', args);
            return Promise.resolve({ rows: [] });
        });

        mockResultTransactions = [
            {
                billing_contract_id: 1,
                identity_id: 1,
                invoiced_at: new Date('2024-10-24'),
                charge_amount_cents: 1000,
                code_id: '1',
                account_id: 1,
                transaction_type: 'test',
                meta: {
                    billing_contract_id: 1,
                    code_id: '1',
                    account_id: 1,
                    transaction_type: 'test',
                    patient_external_id: 'patient-1',
                    service_lines_charge_amount_cents: 1000,
                    schema_type: 'claim_v1',
                    external_id: 'external-1',
                    date_of_service: new Date('2024-10-24'),
                },
                transaction_key: 'external-1',
            }
        ] as unknown as zs.telenutrition.billing_transaction.Insertable[];
    });

    it('should process claims successfully in dry run mode', async () => {
        const params: ProcessClaimsParams = {
            claims: mockClaims,
            contract: mockBillingContract,
            dryRun: true,
        };

        const result = await Claim.Service.processClaims(mockContext, params);

        expect(result).toEqual(mockResultTransactions);
        expect(mockContext.logger.info).toHaveBeenCalledTimes(0);
    });

    it('should throw an error if an unhandled schema version is encountered', async () => {
        const invalidClaim = { ...mockClaims[0], schema_type: 'invalid' } as any;
        const params: ProcessClaimsParams = {
            claims: [invalidClaim],
            contract: mockBillingContract,
            dryRun: false,
        };

        await expect(Claim.Service.processClaims(mockContext, params)).rejects.toThrow('Unhandled schema version');
    });

    it('should retry on 500/502 errors and eventually succeed', async () => {
        const params: ProcessClaimsParams = {
            claims: mockClaims,
            contract: mockBillingContract,
            dryRun: false,
            startTime: Date.now(),
        };

        mockCreate.mockImplementationOnce((...args) => {
            if (LOGGING_ON) console.log('mockCreate returning 500 called');
            return Promise.resolve({ ok: false, error: { content: { reason: 'status-code', statusCode: 500 } } });
        });


        if (mockResultTransactions[0] && mockResultTransactions[0].meta) {
            mockResultTransactions[0].meta['newEncounter'] = {};
        }

        const result = await Claim.Service.processClaims(mockContext, params);

        expect(result).toEqual(mockResultTransactions);
        expect(mockCreate).toHaveBeenCalledTimes(2);
        expect(mockContext.logger.info).toHaveBeenCalledWith(
            mockContext,
            expect.any(String),
            expect.stringContaining('Retrying candidClient.encounters.v4.create()'),
            expect.any(Object)
        );
        expect(mockContext.logger.info).toHaveBeenCalledWith(
            mockContext,
            expect.any(String),
            expect.stringContaining('No further retries'),
            expect.any(Object)
        );
    });

    it('should not retry on EncounterExternalUniqueness errors but should fix the db', async () => {
        const params: ProcessClaimsParams = {
            claims: mockClaims,
            contract: mockBillingContract,
            dryRun: false,
            startTime: Date.now(),
        };

        mockCreate.mockImplementationOnce(() => {
            if (LOGGING_ON) console.log('mockCreate returning EncounterExternalIdUniquenessError called');
            return Promise.resolve({ ok: false, error: { errorName: "EncounterExternalIdUniquenessError", content: { externalId: 'external-1' } } });
        });

        mockGetAll.mockResolvedValueOnce({ ok: true, body: { items: [{ externalId: 'external-1' }] } });

        if (mockResultTransactions[0] && mockResultTransactions[0].meta) {
            mockResultTransactions[0].meta['newEncounter'] = {
                externalId: 'external-1',
            };
        }

        const result = await Claim.Service.processClaims(mockContext, params);

        expect(result).toEqual(mockResultTransactions);
        expect(mockCreate).toHaveBeenCalledTimes(1);
        expect(mockContext.logger.warn).not.toHaveBeenCalledWith(
            mockContext,
            expect.any(String),
            expect.stringContaining('Retry'),
            expect.any(Object)
        );
        expect(mockContext.logger.info).toHaveBeenCalledWith(
            mockContext,
            expect.any(String),
            expect.stringContaining('already exists in Candid, setting createEncounterResponse appropriately'),
            expect.any(Object)
        );
    });

    it('should not retry if flow run time exceeds MAX_FLOW_RUNTIME_HOURS', async () => {
        const params: ProcessClaimsParams = {
            claims: mockClaims,
            contract: mockBillingContract,
            dryRun: false,
            startTime: Date.now() - 25 * 60 * 60 * 1000,
        };

        mockCreate.mockImplementationOnce((...args) => {
            if (LOGGING_ON) console.log('mockCreate returning 500 called');
            return Promise.resolve({ ok: false, error: { content: { reason: 'status-code', statusCode: 500 } } });
        });

        await expect(Claim.Service.processClaims(mockContext, params)).rejects.toThrow("Error processing claim for contract 1: {\"content\":{\"reason\":\"status-code\",\"statusCode\":500}}");
        expect(mockCreate).toHaveBeenCalledTimes(1);
        expect(mockContext.logger.warn).toHaveBeenCalledWith(
            mockContext,
            expect.any(String),
            expect.stringContaining('Exceeded maximum runtime'),
            expect.any(Object)
        );
    });

    it('should not retry if error other than 500/502', async () => {
        const params: ProcessClaimsParams = {
            claims: mockClaims,
            contract: mockBillingContract,
            dryRun: false,
            startTime: Date.now(),
        };

        mockCreate.mockImplementationOnce((...args) => {
            if (LOGGING_ON) console.log('mockCreate returning 400 called', args);
            return Promise.resolve({ ok: false, error: { content: { reason: 'status-code', statusCode: 400 } } });
        });

        await expect(Claim.Service.processClaims(mockContext, params)).rejects.toThrow("Error processing claim for contract 1: {\"content\":{\"reason\":\"status-code\",\"statusCode\":400}}");
        expect(mockCreate).toHaveBeenCalledTimes(1);
        expect(mockContext.logger.warn).not.toHaveBeenCalledWith(
            mockContext,
            expect.any(String),
            expect.stringContaining('Retry'),
            expect.any(Object)
        );
    });

    it('should retry a maximum of 5 times', async () => {
        const params: ProcessClaimsParams = {
            claims: mockClaims,
            contract: mockBillingContract,
            dryRun: false,
            startTime: Date.now(),
        };

        mockCreate.mockImplementation((...args) => {
            if (LOGGING_ON) console.log('mockCreate returning 500 called');
            return Promise.resolve({ ok: false, error: { content: { reason: 'status-code', statusCode: 500 } } });
        });

        await expect(Claim.Service.processClaims(mockContext, params)).rejects.toThrow("Error processing claim for contract 1: {\"content\":{\"reason\":\"status-code\",\"statusCode\":500}}");

        expect(mockCreate).toHaveBeenCalledTimes(6);
        expect(mockContext.logger.info).toHaveBeenCalledWith(
            mockContext,
            expect.any(String),
            expect.stringContaining('Retrying candidClient.encounters.v4.create()'),
            expect.any(Object)
        );
        expect(mockContext.logger.error).toHaveBeenCalledWith(
            mockContext,
            expect.any(String),
            expect.stringContaining('Max retries reached'),
            expect.any(Object)
        );
    });

    it('should log an error if candid returns a mismatched external id', async () => {
        const params: ProcessClaimsParams = {
            claims: mockClaims,
            contract: mockBillingContract,
            dryRun: false,
            startTime: Date.now(),
        };

        mockCreate.mockImplementationOnce(() => {
            if (LOGGING_ON) console.log('mockCreate returning 500 called');
            return Promise.resolve({ ok: false, error: { content: { reason: 'status-code', statusCode: 500 } } });
        });

        mockCreate.mockImplementationOnce(() => {
            if (LOGGING_ON) console.log('mockCreate returning EncounterExternalIdUniquenessError called');
            return Promise.resolve({ ok: false, error: { errorName: "EncounterExternalIdUniquenessError", content: { externalId: '123' } } });
        });

        await expect(Claim.Service.processClaims(mockContext, params)).rejects.toThrow("Error processing claim for contract 1: {\"errorName\":\"EncounterExternalIdUniquenessError\",\"content\":{\"externalId\":\"123\"}}");

        expect(mockContext.logger.error).toHaveBeenCalledWith(
            mockContext,
            expect.any(String),
            expect.stringContaining('mismatch'),
            expect.any(Object)
        );
    });

    it('should log an error if we already have the external id in the store', async () => {
        const params: ProcessClaimsParams = {
            claims: mockClaims,
            contract: mockBillingContract,
            dryRun: false,
            startTime: Date.now(),
        };

        mockSelect.mockResolvedValueOnce([{ external_id: 'external-1' }]);

        mockCreate.mockImplementationOnce(() => {
            if (LOGGING_ON) console.log('mockCreate returning 500 called');
            return Promise.resolve({ ok: false, error: { content: { reason: 'status-code', statusCode: 500 } } });
        });

        mockCreate.mockImplementationOnce(() => {
            if (LOGGING_ON) console.log('mockCreate returning EncounterExternalIdUniquenessError called');
            return Promise.resolve({ ok: false, error: { errorName: "EncounterExternalIdUniquenessError", content: { externalId: 'external-1' } } });
        });

        await expect(Claim.Service.processClaims(mockContext, params)).rejects.toThrow("Error processing claim for contract 1: {\"errorName\":\"EncounterExternalIdUniquenessError - ExternalId already exists in store as well\",\"content\":{\"externalId\":\"external-1\"}}");

        expect(mockContext.logger.error).toHaveBeenCalledWith(
            mockContext,
            expect.any(String),
            expect.stringContaining('already exists'),
            expect.any(Object)
        );
    });

    it('should add the encounter to the store if candid returned EncounterExternalIdUniquenessError and getAll returned an encounter with the same external id', async () => {
        const params: ProcessClaimsParams = {
            claims: mockClaims,
            contract: mockBillingContract,
            dryRun: false,
            startTime: Date.now(),
        };

        mockSelect.mockResolvedValueOnce([]);

        mockCreate.mockImplementationOnce(() => {
            if (LOGGING_ON) console.log('mockCreate returning 500 called');
            return Promise.resolve({ ok: false, error: { content: { reason: 'status-code', statusCode: 500 } } });
        });

        mockCreate.mockImplementationOnce(() => {
            if (LOGGING_ON) console.log('mockCreate returning EncounterExternalIdUniquenessError called');
            return Promise.resolve({ ok: false, error: { errorName: "EncounterExternalIdUniquenessError", content: { externalId: 'external-1' } } });
        });

        mockGetAll.mockResolvedValueOnce({ ok: true, body: { items: [{ externalId: 'external-1' }] } });

        if (mockResultTransactions[0] && mockResultTransactions[0].meta) {
            mockResultTransactions[0].meta['newEncounter'] = {
                externalId: 'external-1',
            };
        }

        const result = await Claim.Service.processClaims(mockContext, params);

        expect(result).toEqual(mockResultTransactions);
        expect(mockContext.logger.info).toHaveBeenCalledWith(
            mockContext,
            expect.any(String),
            expect.stringContaining('already exists in Candid'),
            expect.any(Object)
        );
    });

    it('should log an error if candid encounters.getAll() returns not ok', async () => {
        const params: ProcessClaimsParams = {
            claims: mockClaims,
            contract: mockBillingContract,
            dryRun: false,
            startTime: Date.now(),
        };

        mockSelect.mockResolvedValueOnce([]);

        mockCreate.mockImplementationOnce(() => {
            if (LOGGING_ON) console.log('mockCreate returning 500 called');
            return Promise.resolve({ ok: false, error: { content: { reason: 'status-code', statusCode: 500 } } });
        });

        mockCreate.mockImplementationOnce(() => {
            if (LOGGING_ON) console.log('mockCreate returning EncounterExternalIdUniquenessError called');
            return Promise.resolve({ ok: false, error: { errorName: "EncounterExternalIdUniquenessError", content: { externalId: 'external-1' } } });
        });

        mockGetAll.mockResolvedValueOnce({ ok: false, body: { error: 'error' } });

        await expect(Claim.Service.processClaims(mockContext, params)).rejects.toThrow('error');
        expect(mockContext.logger.error).toHaveBeenCalledWith(
            mockContext,
            expect.any(String),
            expect.stringContaining('Unexpected error while trying to get encounter from Candid'),
            expect.any(Object)
        );
    });

    it('should log an error when candid getAll returns 0 or more than 1 items', async () => {
        const params: ProcessClaimsParams = {
            claims: mockClaims,
            contract: mockBillingContract,
            dryRun: false,
            startTime: Date.now(),
        };

        mockSelect.mockResolvedValueOnce([]);

        mockCreate.mockImplementationOnce(() => {
            if (LOGGING_ON) console.log('mockCreate returning 500 called');
            return Promise.resolve({ ok: false, error: { content: { reason: 'status-code', statusCode: 500 } } });
        });

        mockCreate.mockImplementationOnce(() => {
            if (LOGGING_ON) console.log('mockCreate returning EncounterExternalIdUniquenessError called');
            return Promise.resolve({ ok: false, error: { errorName: "EncounterExternalIdUniquenessError", content: { externalId: 'external-1' } } });
        });

        mockGetAll.mockResolvedValueOnce({ ok: true, body: { items: [] } });

        await expect(Claim.Service.processClaims(mockContext, params)).rejects.toThrow("Error processing claim for contract 1: {\"errorName\":\"EncounterExternalIdUniquenessError\",\"content\":{\"externalId\":\"external-1\"}}");
        expect(mockContext.logger.error).toHaveBeenCalledWith(
            mockContext,
            expect.any(String),
            expect.stringContaining("Expected 1 encounter, got 0"),
            expect.any(Object)
        );

        mockSelect.mockResolvedValueOnce([]);

        mockCreate.mockImplementationOnce(() => {
            if (LOGGING_ON) console.log('mockCreate returning 500 called');
            return Promise.resolve({ ok: false, error: { content: { reason: 'status-code', statusCode: 500 } } });
        });

        mockCreate.mockImplementationOnce(() => {
            if (LOGGING_ON) console.log('mockCreate returning EncounterExternalIdUniquenessError called');
            return Promise.resolve({ ok: false, error: { errorName: "EncounterExternalIdUniquenessError", content: { externalId: 'external-1' } } });
        });

        mockGetAll.mockResolvedValueOnce({ ok: true, body: { items: [{ externalId: 'external-1' }, { externalId: 'external-2' }] } });
        
        await expect(Claim.Service.processClaims(mockContext, params)).rejects.toThrow("Error processing claim for contract 1: {\"errorName\":\"EncounterExternalIdUniquenessError\",\"content\":{\"externalId\":\"external-1\"}}");
        expect(mockContext.logger.error).toHaveBeenCalledWith(
            mockContext,
            expect.any(String),
            expect.stringContaining("Expected 1 encounter, got 2"),
            expect.any(Object)
        );
    });

    it('should log an error if persisting claim transaction fails', async () => {
        const params: ProcessClaimsParams = {
            claims: mockClaims,
            contract: mockBillingContract,
            dryRun: false,
        };

        mockInsert.mockRejectedValue(new Error('DB error'));

        await expect(Claim.Service.processClaims(mockContext, params)).rejects.toThrow('DB error');
        expect(mockContext.logger.error).toHaveBeenCalledWith(
            mockContext,
            expect.any(String),
            'error persisting claim transaction',
            expect.any(Object)
        );
    });
});