import { workflow } from '@mono/common-flows/lib/builder'
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

const EVENT_BUS = 'default'
const EVENT_TYPE = 'analytics.warehouse.deploy.completed'

export default workflow(function(config) {
  return {
  	rate: '12 hours', 
    event: {
      bus: EVENT_BUS,
      source: [ 'foodsmart' ],
      detailType: [
        EVENT_TYPE
      ]
    },
    startAt: 'NormalizeCandidClaims',
    states: {
      NormalizeCandidClaims: Redshift.query({
        sql: `
	BEGIN TRANSACTION;
            DROP TABLE IF EXISTS analytics.normalize_candid_claims;
            CREATE TABLE analytics.normalize_candid_claims  AS
--Normalizing Candid data for claim_v1/claim_v2 schemas where the serviceLines element is populated
select
bt.billing_transaction_id
,nullif(json_extract_path_text(JSON_EXTRACT_ARRAY_ELEMENT_TEXT (json_extract_path_text(BT.meta, 'newEncounter', 'claims'), 0), 'claimId'),'') :: varchar as claim_id
,bt.account_id
,bt.billing_contract_id
,bt.code_id
,split_part(json_extract_path_text(meta,'external_id'),':',2) :: int as clinical_encounter_id
,bt.identity_id
,bt.invoiced_at
,bt.transaction_type
,nullif(json_extract_path_text(meta,'spcl_prgm'),'') :: text as special_program

,nullif(json_extract_path_text(json_extract_array_element_text (json_extract_path_text(json_extract_array_element_text (json_extract_path_text(bt.meta, 'newEncounter', 'claims'), 0), 'serviceLines'), seq.i :: int), 'procedureCode'),'') as procedure_code

,nullif(json_extract_path_text(json_extract_array_element_text (json_extract_path_text(json_extract_array_element_text (json_extract_path_text(bt.meta, 'newEncounter', 'claims'), 0), 'serviceLines'), seq.i :: int), 'modifiers'),'') as procedure_code_modifier

-- ,nullif(json_extract_array_element_text (json_extract_path_text(json_extract_array_element_text (json_extract_path_text(bt.meta, 'newEncounter', 'claims'), 0), 'serviceLines'), seq.i :: int), '') as service_line

,json_extract_path_text(JSON_EXTRACT_ARRAY_ELEMENT_TEXT (json_extract_path_text(BT.meta, 'newEncounter', 'claims'), 0), 'status') as claim_status

,nullif(json_extract_path_text(json_extract_array_element_text (json_extract_path_text(json_extract_array_element_text (json_extract_path_text(bt.meta, 'newEncounter', 'claims'), 0), 'serviceLines'), seq.i :: int), 'denialReason'),'') as denial_reason

,nullif(json_extract_path_text(json_extract_array_element_text (json_extract_path_text(json_extract_array_element_text (json_extract_path_text(bt.meta, 'newEncounter', 'claims'), 0), 'serviceLines'), seq.i :: int), 'quantity'),'') :: decimal as units

,nullif(json_extract_path_text(json_extract_array_element_text (json_extract_path_text(json_extract_array_element_text (json_extract_path_text(bt.meta, 'newEncounter', 'claims'), 0), 'serviceLines'), seq.i :: int), 'chargeAmountCents'),'') :: int as charge_amount_cents

,(nullif(json_extract_path_text(json_extract_array_element_text (json_extract_path_text(json_extract_array_element_text (json_extract_path_text(bt.meta, 'newEncounter', 'claims'), 0), 'serviceLines'), seq.i :: int), 'paidAmountCents'),'') :: int) * -1 as paid_amount_cents

,nullif(json_extract_path_text(JSON_EXTRACT_ARRAY_ELEMENT_TEXT (json_extract_path_text(JSON_EXTRACT_ARRAY_ELEMENT_TEXT (json_extract_path_text(BT.meta, 'newEncounter', 'claims'), 0), 'eras'), 0), 'checkDate'),'') :: date as check_date

,nullif(json_extract_path_text(JSON_EXTRACT_ARRAY_ELEMENT_TEXT (json_extract_path_text(JSON_EXTRACT_ARRAY_ELEMENT_TEXT (json_extract_path_text(BT.meta, 'newEncounter', 'claims'), 0), 'eras'), 0), 'checkNumber'),'') :: text as check_number

,nullif(json_extract_path_text(meta,'schema_type'),'') :: text as schema_type

,'{' ||
 '"era_id": "' || coalesce(json_extract_path_text(JSON_EXTRACT_ARRAY_ELEMENT_TEXT (json_extract_path_text(JSON_EXTRACT_ARRAY_ELEMENT_TEXT (json_extract_path_text(BT.meta, 'newEncounter', 'claims'), 0), 'eras'), 0), 'eraId'), '') :: text || '"' ||
 '}' as meta
 
 ,substring(json_extract_path_text(bt.meta, 'newEncounter', 'last_submitted_at'),1,10) :: date as last_submitted_date

from 
fq_common_telenutrition.billing_transaction bt
cross join 
-- generate 0-3 to iterate through json serviceLines element
(
select 
row_number() over() - 1 as i 
from fq_common_telenutrition.billing_transaction 
limit 4
) seq

where 0 = 0
and json_extract_path_text(bt.meta, 'external_id') like  'athena:%'
and nullif(json_extract_array_element_text (json_extract_path_text(json_extract_array_element_text (json_extract_path_text(bt.meta, 'newEncounter', 'claims'), 0), 'serviceLines'), seq.i :: int), '') is not null
and length(bt.meta) <= 65535

--and split_part(json_extract_path_text(meta,'external_id'),':',2) :: int = 195756 --Test BT record with 2 service line elements

--notes
--there are some external_id 'athena:' records that don't have the serviceLines element
--need to union queries for NQ and basic schema (not v1/v2)
;
	  COMMIT TRANSACTION;   
        `,
      }),   
    }
  }
})
