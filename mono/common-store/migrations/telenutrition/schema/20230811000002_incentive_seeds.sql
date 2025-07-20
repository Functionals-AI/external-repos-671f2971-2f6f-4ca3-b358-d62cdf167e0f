-- migrate:up

-- Insert w / explicit primary keys. 
-- In staging / production these are noops.
INSERT INTO "telenutrition"."reward" 
  ( "reward_id", "description" ) 
VALUES 
  ( 1, '$25 Instacart Fresh Funds' ),
  ( 2, '$15 Instacart Fresh Funds' )
ON CONFLICT DO NOTHING
;

-- Inserting w / explicit primary keys will not update nextval correctly.
-- Set it to get a consistent result in all envs including devenv.
select setval('telenutrition.reward_reward_id_seq'::regclass, 2);

-- The incentive rows start at a primary key of 2 in staging / production
INSERT INTO "telenutrition"."incentive"
  ( "incentive_id", "label", "description", "reward_id" )
VALUES
  (
    2, 
    '$25 Instacart Fresh Funds for Initial Appointment Completion',
    '$25 Instacart Fresh Funds for Initial Appointment Completion',
    1
  ),
  (
    3,
    '$15 Instacart Fresh Funds for Followup Appointment Completion',
    '$15 Instacart Fresh Funds for Followup Appointment Completion',
    2
  )
ON CONFLICT DO NOTHING
;

-- Updated the primary key value so its ready for the next insert.
select setval('telenutrition.incentive_incentive_id_seq'::regclass, 3);

-- incentive rules
INSERT INTO "telenutrition"."incentive_rule"
  (
    "incentive_rule_id",
    "label",
    "params",
    "query"
  )
VALUES
  (
    1,
    'Countycare Instacart Reward',
    '{}',
    -- define the query using Dollar-quoted string constants.
    $query$
    WITH 
      identities_rewarded_25 as (
        WITH 
          reward_user as (
            SELECT 
              reward_user_id,
              reward_id,
              user_id,
              JSON_PARSE(meta) as meta 
            FROM fq_common_telenutrition.reward_user
          )
        SELECT
          distinct(meta.patient_identity_id) as identity_id
        FROM reward_user RU 
        WHERE 
          -- Activity is rewarded with a $25 reward,
          -- either normally (reward ID 1) or via correction (reward ID 3).
          RU.reward_id IN (1, 3)
      ),
      unrewarded_activities as (
        WITH 
          reward_user as (
            SELECT 
              reward_user_id,
              reward_id,
              user_id,
              JSON_PARSE(meta) as meta 
            FROM fq_common_telenutrition.reward_user 
          )
          SELECT  
            AU.user_id,
            AU.identity_id,
            I.account_id,
            activity_id,
            activity_user_id,
            JSON_PARSE(AU.meta) as activity_user_meta,
            ROW_NUMBER() OVER (
              PARTITION BY AU.identity_Id, AU.activity_id
              ORDER BY AU.activity_at, AU.activity_user_id ASC 
            ) as activity_sequence
          FROM fq_common_telenutrition.activity_user AU 
          INNER JOIN fq_common_telenutrition.iam_identity I ON I.identity_Id = AU.identity_id
          LEFT JOIN reward_user RU ON 
            RU.user_id = AU.user_id AND 
            RU.meta.user_activity_id = AU.activity_user_id 
          WHERE 
            AU.activity_id = 1 AND 
            I.account_id = :account_id AND 
            reward_id IS NULL
      ),
      insured_patients as (
        SELECT 
          distinct(patientid) as patient_id 
        FROM athena_stage.patientinsurance_raw WHERE
          insurancepackageid = 359841
      )
    SELECT
      URA.user_id,
      URA.identity_id,
      URA.account_id,
      INC.incentive_id,
      INC.label as incentive_label,
      INC_C.incentive_contract_id,
      URA.activity_id,
      URA.activity_user_id,
      URA.activity_user_meta,
      INC.reward_id as reward_id
    FROM unrewarded_activities URA
    INNER JOIN fq_common_telenutrition.activity A ON A.activity_id = URA.activity_id 
    INNER JOIN fq_common_telenutrition.incentive_contract INC_C ON INC_C.account_id = URA.account_id
    INNER JOIN fq_common_telenutrition.incentive INC ON INC.incentive_id = INC_C.incentive_id
    WHERE
      INC_C.incentive_contract_id = :incentive_contract_id AND 
      A.label = 'Telenutrition Appointment Completed' AND
      URA.activity_user_meta.patient_id IN (
        select patient_id from insured_patients
      ) AND 
      -- Key off of incentive.label to determine whether to associate the unrewarded activity.
      (
        (
          -- $25 reward has not been given and its the first unrewarded activity.
          INC.label LIKE '$25%' AND 
          URA.identity_id NOT IN (select identity_id from identities_rewarded_25) AND 
          URA.activity_sequence = 1
        ) OR 
        (
          -- Associate $15 reward when $25 has been given and its the first in the sequende.
          INC.label LIKE '$15%' AND 
          URA.identity_id NOT IN (select identity_id from identities_rewarded_25) AND 
          URA.activity_sequence > 1
        ) OR (
          INC.label LIKE '$15%' AND 
          URA.identity_id IN (select identity_id from identities_rewarded_25)
        )
      )
    ORDER BY URA.activity_user_id ASC
    ;
    $query$
  )
  ON CONFLICT DO NOTHING
;

INSERT INTO "telenutrition"."incentive_rule"
  (
    "incentive_rule_id",
    "label",
    "params",
    "query"
  )
VALUES
  (
    2,
    'Banner Instacart Reward',
    '{}',
    -- define the query using Dollar-quoted string constants.
    $query$
    WITH 
      -- Get reward_user with parsed JSON meta.
      reward_user as (
        SELECT 
          reward_user_id,
          reward_id,
          user_id,
          JSON_PARSE(meta) as meta 
        FROM fq_common_telenutrition.reward_user RU 
      ),
      identity_reward_count as (
        SELECT
          meta.patient_identity_id as identity_id,
          count(*) as reward_count
        FROM reward_user RU 
        INNER JOIN fq_common_telenutrition.iam_identity I ON I.identity_id = RU.meta.patient_identity_id 
        WHERE I.account_id = :account_id
        GROUP BY meta.patient_identity_id
      ),
      identities_rewarded_25 as (
        SELECT
          distinct(meta.patient_identity_id) as identity_id
        FROM reward_user RU 
        INNER JOIN fq_common_telenutrition.iam_identity I ON I.identity_id = RU.meta.patient_identity_id 
        WHERE 
          I.account_id = :account_id AND 
          -- Activity is rewarded with a $25 reward,
          -- either normally (reward ID 1) or via correction (reward ID 3).
          RU.reward_id IN (1, 3)
      ),
      unrewarded_activities as (
        WITH 
          activity_user as (
            SELECT 
              activity_user_id,
              user_id,
              identity_id,
              activity_id,
              activity_at,
              JSON_PARSE(meta) as meta 
            FROM fq_common_telenutrition.activity_user 
          ),
          activities_and_rewards as (
            SELECT  
              AU.user_id,
              AU.identity_id,
              I.account_id,
              AU.activity_id,
              AU.activity_user_id,
              AU.meta as activity_user_meta,
              ROW_NUMBER() OVER (
                PARTITION BY AU.identity_Id, AU.activity_id
                ORDER BY AU.activity_at, AU.activity_user_id ASC 
              ) AS activity_sequence,
              IRC.reward_count as reward_count
            FROM activity_user AU 
            INNER JOIN fq_common_telenutrition.iam_identity I ON I.identity_Id = AU.identity_id
            LEFT JOIN reward_user RU ON 
              RU.user_id = AU.user_id AND 
              RU.meta.user_activity_id = AU.activity_user_id 
            LEFT JOIN identity_reward_count IRC ON IRC.identity_id = AU.identity_id
            WHERE 
              I.account_id = :account_id AND 
              reward_id IS NULL
          )
        SELECT 
          user_id, 
          identity_id, 
          account_id,
          activity_id, 
          activity_user_id, 
          activity_user_meta,
          activity_sequence,
          reward_count
        FROM activities_and_rewards 
        WHERE 
          (reward_count IS NULL) AND (activity_sequence <= 4) OR 
          (reward_count IS NOT NULL) AND (reward_count + activity_sequence <= 4)
      )
    SELECT
      URA.user_id,
      URA.identity_id,
      URA.account_id,
      INC.incentive_id,
      INC.label as incentive_label,
      INC_C.incentive_contract_id,
      URA.activity_id,
      URA.activity_user_id,
      URA.activity_user_meta,
      INC.reward_id as reward_id
    FROM unrewarded_activities URA
    INNER JOIN fq_common_telenutrition.activity A ON A.activity_id = URA.activity_id 
    INNER JOIN fq_common_telenutrition.incentive_contract INC_C ON INC_C.account_id = URA.account_id
    INNER JOIN fq_common_telenutrition.incentive INC ON INC.incentive_id = INC_C.incentive_id
    WHERE
      INC_C.incentive_contract_id = :incentive_contract_id AND 
      A.label = 'Telenutrition Appointment Completed' AND
      --
      -- Key off of incentive.label to compare appointment type.
      -- Only reward first as initial, and up to 3 followups.
      -- Ignore appointment type, but just consider activity sequence.
      -- Three cases to consider
      --
      (
        (
          -- 1 Identity has not been rewarded a $25 reward.
          --    Reward with the first unreward activity which will receive the $25 reward.
          INC.label LIKE '$25%' AND 
          (URA.identity_id NOT IN (select identity_id from identities_rewarded_25)) AND 
          URA.activity_sequence = 1
        ) OR 
        (
          -- 2 Identity has not been reward a $25, 
          --   Reward with $15 when sequence is > 1 as $25 will be greated to sequence 1.
          INC.label LIKE '$15%' AND 
          (URA.identity_id NOT IN (select identity_id from identities_rewarded_25)) AND 
          URA.activity_sequence > 1
        ) OR
        (
          -- 3 Identity has been reward a $25, reward with any sequence.
          --   All will be given a $15.
          INC.label LIKE '$15%' AND 
          (URA.identity_id IN (select identity_id from identities_rewarded_25))
        )
      )
    ORDER BY URA.activity_user_id ASC 
    ;
    $query$
  )
  ON CONFLICT DO NOTHING
;

-- incentive contracts
INSERT INTO "telenutrition"."incentive_contract" 
  ( 
    "incentive_contract_id", 
    "account_id",
    "incentive_id",
    "active_at",
    "incentive_rule_id",
    "param_values"
  )
VALUES 
  ( 1, 46, 2, '2023-04-01 00:00:00', 1, '{}' ),
  ( 2, 46, 3, '2023-04-01 00:00:00', 1, '{}' ),
  ( 3, 37, 2, '2023-06-30 00:00:00', 2, '{}' ),
  ( 4, 37, 3, '2023-06-30 00:00:00', 2, '{}' )
ON CONFLICT DO NOTHING
;

-- Incentive account had previously been renamed.
select setval('telenutrition.incentive_account_incentive_account_id_seq'::regclass, 4);

-- migrate:down
