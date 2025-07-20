import { buildBillingRuleQuery } from './service';

describe('buildBillingRuleQuery', () => {
  const billingRuleContext = {
    billing_contract_id: 1,
    billing_contract_active_at: '2000-01-01T12:00:00',
    billing_contract_inactive_at: '2000-01-01T12:00:00',
    billing_contract_rate: '$6.48',
    account_id: 1,
    account_features: ['feature1', 'feature2'],
  };

  it('builds queries with the named params', async () => {
    const query =
      'SELECT :billing_contract_id AS billing_contract_id, ' +
      ':billing_contract_active_at AS billing_contract_active_at, ' +
      ':billing_contract_inactive_at AS billing_contract_inactive_at, ' +
      ':billing_contract_rate AS billing_contract_rate, ' +
      ':account_id AS account_id, ' +
      ':account_features AS account_features;';

    const expected =
      'SELECT 1 AS billing_contract_id, ' +
      "'2000-01-01T12:00:00'::timestamp AS billing_contract_active_at, " +
      "'2000-01-01T12:00:00'::timestamp AS billing_contract_inactive_at, " +
      "'$6.48'::money AS billing_contract_rate, " +
      '1 AS account_id, ' +
      `'{"feature1","feature2"}'::text[] AS account_features;`;

    const received = buildBillingRuleQuery(query, billingRuleContext);
    expect(received).toBe(expected);
  });

  it('builds queries with duplicate named params', async () => {
    const query = 'SELECT :billing_contract_id AS id, :billing_contract_id AS id2;';
    const expected = 'SELECT 1 AS id, 1 AS id2;';
    const received = buildBillingRuleQuery(query, billingRuleContext);
    expect(received).toBe(expected);
  });
});
