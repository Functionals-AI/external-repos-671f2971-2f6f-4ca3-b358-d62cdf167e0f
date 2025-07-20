import { Result, ok, err } from 'neverthrow'

import { ErrCode } from '@mono/common/lib/error'
import { IContext } from '@mono/common/lib/context'

const MTAG = [ 'ops', 'incentives', 'store']

//
// No. of days of history to examine to compute code usage.
//
export const CODE_USAGE_HISTORY_DAYS = 90

/**
 * @typedef {Object} GetInstacartCodeInvenoryOptions - options for querying 
 * Instacart code inventory.
 * 
 * @property {number} history - Number of days of history to examine. Default, 90 days.
 */
export interface GetInstacartCodeInventoryOptions {
  historyDays: number,
}

/**
 * @typedef {Object} InstacartCodeInventry - Snapshot of inventory including usage.
 * 
 * @property {string} denomination - denomination, string. IE: '$25'
 * @property {number} inventory - current code inventory, integer >= 0.
 * @property {number} dailyConsumption - integer avg. of codes consumed per day.
 * @property {number} daysRemaining - number of days until no more codes are available.
 * @property {number} requiredNDaysCodes - number of codes required for n days, integer >= 0.
 * @property {number} surplusNDays - number when a surpluse, else undefined.
 * @property {number} deficitNDays - number when a deficit, else undefined.
 * @property {number} codesToRequest - positive int when more codes are needed, else 0.
 */
export type InstacartCodeInventory = {
  denomination: string, // '$200' | '$100' | '$25' | '$15', allow any to be flexible.
  inventory: number,
  dailyConsumption: number,
  daysRemaining: number,
  requiredNDaysCodes: number,
  surplusNDays?: number,
  deficitNDays?: number,
  codesToRequest: number,
}

export async function getInstacartCodeInventory(context: IContext, options?: GetInstacartCodeInventoryOptions): Promise<Result<InstacartCodeInventory[], ErrCode>> {
  const { logger, store: { reader, } } = context
  const TAG = [ ...MTAG, 'getInstacartCodeInventory' ]

  try {
    const historyDays = options?.historyDays ?? CODE_USAGE_HISTORY_DAYS
    const pool = await reader()

    //
    // Columns return in query:
    //    
    // denomination - denomination, string.
    // inventory - current code inventory, integer >= 0.
    // daily_consumption - integer avg. of codes consumed per day.
    // required_n_days_codes - number of codes required for n days, integer >= 0.
    // surplus_n_days - number when a surpluse, else NULL.
    // deficit_n_days - number when a deficit, else NULL.
    // codes_to_request - positive int when more codes are needed, else 0.
    //
    const query = `
with incentive_by_date as (
  select 
    to_char(date_trunc('day', rewarded_at), 'YYYY-MM-DD') as rewarded_date,
    cast(RU.meta->>'incentive_id' as  int)  as incentive_id 
  from "telenutrition"."reward_user" RU 
  where 
    rewarded_at >= NOW() - make_interval(days => $1)
),
counts_by_date as (
  select 
    rewarded_date,
    case 
      when incentive_id IN (9,10) then '$200' 
      when incentive_id IN (7, 8) then '$100' 
      when incentive_id = 4 then '$50' 
      when incentive_id IN (2, 5) then '$25' 
     else '$15' end as denomination,
    count(*)
  from incentive_by_date 
  group by rewarded_date, denomination
  order by rewarded_date, denomination DESC 
),
code_counts as (
  select 
    ACD.rewarded_date, 
    case 
      when denomination = '$50' then '$25' 
      else denomination
    end as denomination,
    case 
      when denomination = '$50' then count * 2
      else count 
    end as code_count 
  from counts_by_date ACD 
),
grouped_counts as ( 
  select 
    rewarded_date,
    denomination,
    sum(code_count) as count 
  from code_counts CC 
  group by denomination, rewarded_date
  order by denomination DESC, date(rewarded_date) DESC 
),
inventory as (
  with denominations (denomination) as (
    VALUES 
      ('$15'::money),
      ('$25' :: money),
      ('$100' :: money),
      ('$200' :: money) 
  ),
  available_codes as (
    select 
      initial_balance as denomination,  
      count(*) as inventory 
    from telenutrition.instacart_code 
    where 
      wallet_id IS NULL 
    group by denomination 
  ) 
  select 
    D.denomination,
    case 
      when AC.denomination IS NULL then 0 
      else AC.inventory 
    end as inventory
  from denominations D 
  left join available_codes AC on D.denomination = AC.denomination 
),
summary as (
  select 
    I.denomination,
    avg(count) :: int as daily_consumption,
    (avg(count) * $1) :: int as required_n_days_codes,
    case 
      when I.denomination IS NULL then 0 
      else max(I.inventory) 
    end as inventory,
    case 
      when I.denomination IS NULL then NULL 
      when max(I.inventory) > (avg(count) * $1) then (max(I.inventory) - (avg(count) * $1)) :: int 
      else NULL 
    end as surplus_n_days,
    case 
      when I.denomination IS NULL then (avg(count) * $1) :: int 
      when max(I.inventory) < (avg(count) * $1) then ((avg(count) * $1) - max(I.inventory)) :: int 
      else NULL
    end as deficit_n_days
  from inventory I 
  left join grouped_counts GC ON I.denomination = GC.denomination :: money 
  group by I.denomination, GC.denomination
  order by I.denomination ASC 
)
select 
  *,
  case 
    when daily_consumption > 0 then inventory / daily_consumption 
    else NULL 
  end as days_remaining,
  case 
    when deficit_n_days IS NOT NULL and deficit_n_days >= (daily_consumption * 60) then required_n_days_codes - inventory
    else 0 
  end as codes_to_request 
from summary 
;
`
    const queryResult = await pool.query(query, [ historyDays ])

    if (queryResult.rows.length < 1) {
      logger.error(context, TAG, 'Inventory query return no rows.', {
        historyDays,
        queryResult,
      })

      return err(ErrCode.SERVICE)
    }
    else {
      const result: InstacartCodeInventory[] = []

      for (const row of queryResult.rows) {
        result.push({
          denomination: row.denomination,
          inventory: row.inventory,
          dailyConsumption: row.daily_consumption,
          requiredNDaysCodes: row.required_n_days_codes,
          surplusNDays: row.surplus_n_days,
          deficitNDays: row.deficit_n_days,
          daysRemaining: row.days_remaining,
          codesToRequest: row.codes_to_request,
        })
      }

      return ok(result)
    }
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export default {
  getInstacartCodeInventory,
}