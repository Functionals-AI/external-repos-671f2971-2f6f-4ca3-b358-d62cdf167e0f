-- migrate:up
create schema if not exists deident_common;

create materialized view if not exists deident_common.account as
select * from common.account;

create materialized view if not exists deident_common.common_eligibility_member as
SELECT 
    em.eligibility_id,
    em.account_id,
    cim.identity_did, -- remapped from identity_id
    -- external_member_id,
    em.eligibility_effective_date,
    em.eligibility_termination_date,
    em.eligibility_added_date,
    em.eligibility_removed_date,
    -- demographic_first_name,
    -- demographic_last_name,
    -- demographic_dob,
    -- demographic_lang,
    -- demographic_gender,
    -- contact_phone,
    -- contact_phone_mobile,
    -- contact_phone_home,
    -- contact_email,
    -- location_address_1,
    -- location_address_2,
    -- location_city,
    em.location_state,
    left(em.location_zipcode::varchar,3)::integer as location_zip3,
    em.insurance_group_id,
    em.insurance_policy_id,
    em.insurance_effective_date,
    em.insurance_termination_date,
    em.insurance_carrier_name,
    em.insurance_plan_name,
    em.insurance_plan_tier,
    em.insurance_lob,
    em.insurance_is_primary,
    em.insurance_relationship,
    em.insurance_subscriber_policy_id,
    -- insurance_subscriber_first_name,
    -- insurance_subscriber_last_name,
    -- insurance_subscriber_dob,
    -- insurance_subscriber_gender,
    em.comm_optout_email,
    em.comm_optout_phone,
    em.comm_preference
    -- source_data
FROM common.eligibility_member em
left join deident.common_identity_mapping cim on cim.identity_id = em.identity_id;

create materialized view if not exists deident_common.common_employee as
SELECT 
    employee_id,
    company,
    role_state,
    employment_type,
    start_date,
    end_date,
    title,
    -- first_name,
    -- last_name,
    preferred_first_name,
    preferred_last_name,
    -- personal_email,
    work_email,
    -- custom_fields,
    rippling_id,
    rippling_employee_number,
    source_created_at,
    source_updated_at,
    created_at,
    rippling_user_id
FROM common.employee;

create materialized view if not exists deident_common.common_meeting_participant as
SELECT 
    tum.user_did, -- remapped from user_id
    mp.meeting_id,
    mp.join_time,
    mp.leave_time,
    mp.duration,
    mp.internal_user
    -- raw_data
FROM common.meeting_participant mp
left join deident.telenutrition_user_mapping tum on tum.user_id = mp.user_id::integer;

-- migrate:down

drop materialized view if exists deident_common.common_eligibility_member;
drop materialized view if exists deident_common.common_employee;
drop materialized view if exists deident_common.common_meeting_participant;
drop schema if exists deident_common;