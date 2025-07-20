-- migrate:up
--Create Schema
create schema if not exists deident_telenutrition;
--create materialized view if not existss


create materialized view if not exists deident_telenutrition.account_payment_method_type as
select * from telenutrition.account_payment_method_type;

create materialized view if not exists deident_telenutrition.activity as
select * from telenutrition.activity;

create materialized view if not exists deident_telenutrition.activity_user as
SELECT 
    au.activity_user_id,
    au.activity_id,
    tum.user_did as user_id,
    cim.identity_did as identity_id,
    -- meta,
    au.activity_at,
    au.created_at
FROM telenutrition.activity_user au
inner join deident.telenutrition_user_mapping tum on tum.user_id = au.user_id
inner join deident.common_identity_mapping cim on cim.identity_id = au.identity_id;

create materialized view if not exists deident_telenutrition.appointment_cancel_reason as
select * from telenutrition.appointment_cancel_reason;

-- create materialized view if not exists deident_telenutrition.athena_api_auth as
-- select * from telenutrition.athena_api_auth;

create materialized view if not exists deident_telenutrition.billing_code as
select * from telenutrition.billing_code;

create materialized view if not exists deident_telenutrition.billing_contract as
select * from telenutrition.billing_contract;

create materialized view if not exists deident_telenutrition.billing_rule as
select * from telenutrition.billing_rule;

create materialized view if not exists deident_telenutrition.billing_rule_history as
select * from telenutrition.billing_rule_history;

create materialized view if not exists deident_telenutrition.billing_service_facility as
select * from telenutrition.billing_service_facility;

create materialized view if not exists deident_telenutrition.billing_transaction as
SELECT 
    bt.billing_transaction_id,
    bt.billing_contract_id,
    cim.identity_did as identity_id,
    -- meta,
    bt.invoiced_at,
    bt.created_at,
    bt.status,
    bt.code_id,
    bt.account_id,
    bt.transaction_type,
    bt.charge_amount_cents,
    bt.transaction_key
FROM telenutrition.billing_transaction bt
inner join deident.common_identity_mapping cim on cim.identity_id = bt.identity_id;

create materialized view if not exists deident_telenutrition.clinical_encounter as 
SELECT 
    tem.encounter_did as encounter_id,
    tpm.patient_did as patient_id,
    tam.appointment_did as appointment_id,
    ce.department_id,
    tprm.provider_did as provider_id,
    -- ce.encounter_type,
    ce.encounter_date,
    ce.actual_starttime,
    -- ce.encounter_status,
    ce.created_by,
    ce.assigned_to,
    ce.closed_datetime,
    ce.closed_by,
    ce.deleted_datetime,
    ce.deleted_by,
    -- ce.specialty,
    ce.billing_tab_reviewed,
    ce.documented_by,
    ce.close_attempted_yn,
    ce.last_reopened,
    ce.last_modified,
    ce.previously_closed_datetime,
    ce.cancel_reason_note,
    -- ce.patient_status_id,
    ce.last_reopened_by,
    ce.previously_closed_by,
    -- ce.specialty_id,
    ce.actual_endtime,
    ce.total_minutes,
    ce.units_billed,
    -- ce.diagnosis_code,
    ce.billing_code,
    ce.created_at,
    ce.updated_at,
    -- raw_data,
    ce.timer_started_at,
    ce.timer_ended_at,
    ce.oversight_comment,
    ce.oversight_by,
    ce.oversight_at,
    ce.oversight_status
FROM telenutrition.clinical_encounter ce
inner join deident.telenutrition_encounter_mapping tem on tem.encounter_id = ce.encounter_id
inner join deident.telenutrition_patient_mapping tpm on tpm.patient_id = ce.patient_id
inner join deident.telenutrition_provider_mapping tprm on tprm.provider_id = ce.provider_id
inner join deident.telenutrition_appointment_mapping tam on tam.appointment_id = ce.appointment_id;

create materialized view if not exists deident_telenutrition.clinical_encounter_amendment as
SELECT 
    tcam.amendment_did as amendment_id,
    tem.encounter_did as encounter_id,
    cea.units_billed,
    cea.billing_code,
    cea.reason,
    cea."comments",
    cea.status,
    cea.created_at,
    cea.resolved_at,
    cea.resolved_by
FROM telenutrition.clinical_encounter_amendment cea
inner join deident.telenutrition_encounter_mapping tem on tem.encounter_id = cea.encounter_id
inner join deident.telenutrition_clinical_encounter_amendment_mapping tcam on tcam.amendment_id = cea.amendment_id;

create materialized view if not exists deident_telenutrition.clinical_encounter_history as 
SELECT 
    tem.encounter_did as encounter_id,
    tpm.patient_did as patient_id,
    tam.appointment_did as appointment_id,
    ce.department_id,
    tprm.provider_did as provider_id,
    -- ce.encounter_type,
    ce.encounter_date,
    ce.actual_starttime,
    -- ce.encounter_status,
    ce.created_by,
    ce.assigned_to,
    ce.closed_datetime,
    ce.closed_by,
    ce.deleted_datetime,
    ce.deleted_by,
    -- ce.specialty,
    ce.billing_tab_reviewed,
    ce.documented_by,
    ce.close_attempted_yn,
    ce.last_reopened,
    ce.last_modified,
    ce.previously_closed_datetime,
    ce.cancel_reason_note,
    -- ce.patient_status_id,
    ce.last_reopened_by,
    ce.previously_closed_by,
    -- ce.specialty_id,
    ce.actual_endtime,
    ce.total_minutes,
    ce.units_billed,
    -- ce.diagnosis_code,
    ce.billing_code,
    ce.created_at,
    ce.updated_at,
    -- raw_data,
    ce.timer_started_at,
    ce.timer_ended_at,
    ce.oversight_comment,
    ce.oversight_by,
    ce.oversight_at,
    ce.oversight_status
FROM telenutrition.clinical_encounter_history ce
inner join deident.telenutrition_encounter_mapping tem on tem.encounter_id = ce.encounter_id
inner join deident.telenutrition_patient_mapping tpm on tpm.patient_id = ce.patient_id
inner join deident.telenutrition_provider_mapping tprm on tprm.provider_id = ce.provider_id
inner join deident.telenutrition_appointment_mapping tam on tam.appointment_id = ce.appointment_id;

create materialized view if not exists deident_telenutrition.clinical_encounter_oversight as 
SELECT 
    tem.encounter_id,
    ceo.created_at,
    ceo.updated_at,
    ceo.oversight_by,
    ceo.oversight_at,
    ceo.oversight_status,
    ceo.cpt_modifier,
    ceo.cpt_code
FROM telenutrition.clinical_encounter_oversight ceo
inner join deident.telenutrition_encounter_mapping tem on tem.encounter_id = ceo.encounter_id;

create materialized view if not exists deident_telenutrition.clinical_encounter_screening_questionnaire as 
SELECT
    ces.questionnaire_id,
    tem.encounter_did as encounter_id,
    tam.appointment_did as appointment_id,
    pa.patient_did as patient_id,
    pr.provider_did as provider_id,
    ces.questionnaire_type,
    ces.form_data,
    ces.determination_code,
    ces.determination_meta,
    ces.created_at
FROM telenutrition.clinical_encounter_screening_questionnaire ces
inner join deident.telenutrition_encounter_mapping tem on tem.encounter_id = ces.encounter_id
inner join deident.telenutrition_appointment_mapping tam on tam.appointment_id = ces.appointment_id
inner join deident.telenutrition_patient_mapping pa on pa.patient_id = ces.patient_id
inner join deident.telenutrition_provider_mapping pr on pr.provider_id = ces.provider_id;

create materialized view if not exists deident_telenutrition.common_verification as 
SELECT * FROM telenutrition.common_verification;

create materialized view if not exists deident_telenutrition.common_verification_method as 
select * from telenutrition.common_verification_method;

create materialized view if not exists deident_telenutrition.food_offering_type as 
select * from telenutrition.food_offering_type;

create materialized view if not exists deident_telenutrition.food_offering_type_history as 
select * from telenutrition.food_offering_type_history;

create materialized view if not exists deident_telenutrition.food_vendor as 
select * from telenutrition.food_vendor;

create materialized view if not exists deident_telenutrition.food_vendor_history as 
select * from telenutrition.food_vendor_history;

create materialized view if not exists deident_telenutrition.food_vendor_offering_mapping as 
select * from telenutrition.food_vendor_offering_mapping;

create materialized view if not exists deident_telenutrition.food_vendor_offering_mapping_history as
SELECT * FROM telenutrition.food_vendor_offering_mapping_history;


create materialized view if not exists deident_telenutrition.historical_athena_encounter_raw as 
SELECT 
    tem.encounter_did as encounter_id,
    tam.appointment_did as appointment_id,
    tpm.patient_did as patient_id,
    -- raw_data,
    haer.encounter_date
FROM telenutrition.historical_athena_encounter_raw haer
inner join deident.telenutrition_encounter_mapping tem on tem.encounter_id = haer.encounter_id
inner join deident.telenutrition_appointment_mapping tam on tam.appointment_id = haer.appointment_id
inner join deident.telenutrition_patient_mapping tpm on tpm.patient_id = haer.patient_id;

create materialized view if not exists deident_telenutrition.iam_federated_credentials as 
SELECT
    ifc.federated_id,
    tum.user_did as user_id,
    ifc.provider,
    ifc.subject
FROM telenutrition.iam_federated_credentials ifc
inner join deident.telenutrition_user_mapping tum on tum.user_id = ifc.user_id;

create materialized view if not exists deident_telenutrition.iam_identity as 
SELECT 
    cim.identity_did as identity_id,
    -- ii.first_name,
    -- ii.last_name,
    -- ii.birthday,
    left(ii.zip_code,3) as zip3,
    ii.account_id,
    ii.eligible_id
    -- ii.norm_comma_name
FROM telenutrition.iam_identity ii
inner join deident.common_identity_mapping cim on cim.identity_id = ii.identity_id;

create materialized view if not exists deident_telenutrition.iam_user as 
SELECT 
    tum.user_did as user_id,
    -- iu.fs_user_id,-Not sure on these two
    -- iu.fs_eligible_id,-Not sure on these two
    -- email,
    cim.identity_did as identity_id,
    -- phone,
    -- "password",
    iu.password_reset_time,
    iu.roles,
    iu.password_verification_id,
    iu.enrollment,
    iu.created_at
FROM telenutrition.iam_user iu
inner join deident.telenutrition_user_mapping tum on tum.user_id = iu.user_id
inner join deident.common_identity_mapping cim on cim.identity_id = iu.identity_id;

create materialized view if not exists deident_telenutrition.incentive as 
    select * from telenutrition.incentive;

create materialized view if not exists deident_telenutrition.incentive_contract as 
    select * from telenutrition.incentive_contract;

create materialized view if not exists deident_telenutrition.incentive_rule as 
    select * from telenutrition.incentive_rule;

create materialized view if not exists deident_telenutrition.instacart_code as 
    select * from telenutrition.instacart_code;

create materialized view if not exists deident_telenutrition.instacart_code_order as 
    select * from telenutrition.instacart_code_order;

create materialized view if not exists deident_telenutrition.issue_report as 
    select * from telenutrition.issue_report;

create materialized view if not exists deident_telenutrition.issue_report_type as 
    select * from telenutrition.issue_report_type;

create materialized view if not exists deident_telenutrition.medallion_provider as 
SELECT 
    medallion_id,
    tpm.provider_id,
    mp.employee_id,
    -- first_name,
    -- last_name,
    -- npi,
    mp.percent_complete,
    mp.profile_completion_state,
    mp.percent_complete_last_checked,
    mp.verification_status,
    mp.verification_status_last_checked,
    mp.credentialing_committee_status,
    mp.initial_credentialing_date,
    mp.latest_credentialing_date,
    mp.credentialing_step,
    mp.caqh_number
FROM telenutrition.medallion_provider mp
inner join deident.telenutrition_provider_mapping tpm on tpm.provider_id = mp.provider_id;

create materialized view if not exists deident_telenutrition.patient_payment_transaction as 
    SELECT 
        ppt.payment_transaction_id,
        ppt.status,
        tpm.patient_did as patient_id,
        ppt.payment_method_id,
        tam.appointment_did as appointment_id,
        ppt.created_at,
        ppt.updated_at
    FROM telenutrition.patient_payment_transaction ppt
    inner join deident.telenutrition_patient_mapping tpm on tpm.patient_id = ppt.patient_id
    inner join deident.telenutrition_appointment_mapping tam on tam.appointment_id = ppt.appointment_id;
-- create materialized view if not exists deident_telenutrition.payer_provider_schedulability as 
--     select * from telenutrition.payer_provider_schedulability;
create materialized view if not exists deident_telenutrition.payer_roster as 
    SELECT 
        pr.payer_roster_id,
        tpaym.payer_did as payer_id,
        tprm.provider_did as provider_id,
        pr.effective_date,
        pr.end_date,
        pr.created_at,
        pr.created_by,
        pr.updated_at,
        pr.updated_by
    FROM telenutrition.payer_roster pr
    inner join deident.telenutrition_payer_mapping tpaym on tpaym.payer_id = pr.payer_id
    inner join deident.telenutrition_provider_mapping tprm on tprm.provider_id = pr.provider_id;

create materialized view if not exists deident_telenutrition.payment_eligibility_check as 
    select * from telenutrition.payment_eligibility_check;

create materialized view if not exists deident_telenutrition.payment_method_type as 
    SELECT 
        pmt.payment_method_type_id,
        pmt."method",
        pmt."label",
        tim.insurance_did as insurance_id,
        tem.employer_did as employer_id,
        pmt.eligibility_check_type,
        pmt.eligibility_optional,
        tprm.payer_did as payer_id,
        pmt.visible,
        pmt.follow_up_durations,
        pmt.audio_support,
        pmt."schema",
        pmt.sponsor_id
    FROM telenutrition.payment_method_type pmt
    inner join deident.telenutrition_insurance_mapping tim on tim.insurance_id = pmt.insurance_id
    inner join deident.telenutrition_employer_mapping tem on tem.employer_id = pmt.employer_id
    inner join deident.telenutrition_payer_mapping tprm on tprm.payer_id = pmt.payer_id;

create materialized view if not exists deident_telenutrition.provider_board_certificate as 
    SELECT 
        pbc.certificate_id,
        pbc.medallion_id,
        tprm.provider_did as provider_id,
        pbc."source",
        pbc.abms,
        pbc.board_name,
        pbc.is_board_certification,
        pbc.specialty,
        pbc.certification_number,
        pbc.is_exam_passed,
        pbc.issue_date,
        pbc.is_indefinite,
        pbc.expiration_date,
        pbc.recertification_date,
        pbc.exam_date,
        pbc.moc_status,
        pbc.is_meeting_moc,
        pbc.moc_verification_date,
        pbc.moc_annual_reverification_date,
        pbc.requires_verification,
        pbc.created_at,
        pbc.updated_at
    FROM telenutrition.provider_board_certificate pbc
    inner join deident.telenutrition_provider_mapping tprm on tprm.provider_id = pbc.provider_id;

create materialized view if not exists deident_telenutrition.provider_license as 
    SELECT
        pl.license_id,
        pl."source",
        pl.medallion_id,
        tprm.provider_did as provider_id,
        pl.status,
        pl.state,
        pl.issue_date,
        pl.expiration_date,
        pl.license_number,
        pl.certificate_type,
        pl.candid_provider_credentialing_span_id,
        pl.created_at,
        pl.created_by,
        pl.updated_at,
        pl.updated_by,
        pl.verification_status,
        pl.cached_verified_at,
        pl.cached_verified_expiration_date
    FROM telenutrition.provider_license pl
    inner join deident.telenutrition_provider_mapping tprm on tprm.provider_id = pl.provider_id;

create materialized view if not exists deident_telenutrition.provider_license_application as 
    SELECT 
        pla.license_application_id,
        tprm.provider_did as provider_id,
        pla.state,
        pla.tracking_number,
        pla.tracking_meta,
        pla.status,
        pla.submitted_date,
        pla.attested_by,
        pla.attested_at,
        pla.created_at,
        pla.created_by,
        pla.updated_at,
        pla.updated_by
    FROM telenutrition.provider_license_application pla
    inner join deident.telenutrition_provider_mapping tprm on tprm.provider_id = pla.provider_id;

    -- create materialized view if not exists deident_telenutrition.provider_license_summary as 
    -- select * from telenutrition.provider_license_summary;

create materialized view if not exists deident_telenutrition.provider_program_enrollment as 
    SELECT 
        ppe.program_enrollment_id,
        tprm.provider_did as provider_id,
        ppe."program",
        ppe.status,
        ppe.enrollment_type,
        ppe.state,
        ppe.tracking_number,
        ppe.rd_attestation,
        ppe.submitted_verification_date,
        ppe.submission_verification_method,
        ppe.submission_verified_by,
        ppe.program_id,
        ppe.program_id_effective_date,
        ppe.program_id_revalidation_date,
        ppe.approval_verified_date,
        ppe.approval_verified_by,
        ppe.approval_verification_method,
        ppe.notes,
        ppe.doc_file_url,
        ppe.created_at,
        ppe.created_by,
        ppe.updated_at,
        ppe.updated_by,
        ppe.input_format
    FROM telenutrition.provider_program_enrollment ppe
    inner join deident.telenutrition_provider_mapping tprm on tprm.provider_id = ppe.provider_id;

create materialized view if not exists deident_telenutrition.provider_task as 
    SELECT 
        pt.task_id,
        tprm.provider_did as provider_id,
        pt."name",
        pt.note,
        pt.due_date,
        pt.priority,
        pt.status,
        pt.created_at,
        pt.updated_at
    FROM telenutrition.provider_task pt
    inner join deident.telenutrition_provider_mapping tprm on tprm.provider_id = pt.provider_id;

-- create materialized view if not exists deident_telenutrition.referral_source as 
--     select * from telenutrition.referral_source;

-- create materialized view if not exists deident_telenutrition.referral_source_history as 
--     select * from telenutrition.referral_source_history;

create materialized view if not exists deident_telenutrition.reward as 
    select * from telenutrition.reward;

create materialized view if not exists deident_telenutrition.reward_user as 
    SELECT 
        ru.reward_user_id,
        ru.reward_id,
        tum.user_did as user_id,
        -- ru.meta,
        ru.rewarded_at,
        ru.created_at
    FROM telenutrition.reward_user ru
    inner join deident.telenutrition_user_mapping tum on tum.user_id = ru.user_id;

create materialized view if not exists deident_telenutrition.schedule_appointment as 
    SELECT 
        tam.appointment_did as appointment_id,
        sa.appointment_type_id,
        sa."date",
        sa.duration,
        sa.start_time,
        tprm.provider_did as provider_id,
        sa.department_id,
        sa.frozen,
        sa.start_timestamp,
        sa.status,
        tpm.patient_did as patient_id,
        sa.created_at,
        sa.updated_at,
        sa.payment_method_id,
        sa.accepted_payment_method_id,
        sa.scheduled_at,
        sa.meeting,
        sa.scheduled_by,
        sa.cancel_reason_id,
        sa.cancelled_at,
        sa.cancelled_by,
        sa.coordinator_ruid,
        sa.waiting_id,
        sa.meeting_id
    FROM telenutrition.schedule_appointment sa
    inner join deident.telenutrition_appointment_mapping tam on tam.appointment_id = sa.appointment_id
    inner join deident.telenutrition_patient_mapping tpm on tpm.patient_id = sa.patient_id
    inner join deident.telenutrition_provider_mapping tprm on tprm.provider_id = sa.provider_id;

create materialized view if not exists deident_telenutrition.schedule_appointment_history as 
    SELECT 
        tam.appointment_did as appointment_id,
        sa.appointment_type_id,
        sa."date",
        sa.duration,
        sa.start_time,
        tprm.provider_did as provider_id,
        sa.department_id,
        sa.frozen,
        sa.start_timestamp,
        sa.status,
        tpm.patient_did as patient_id,
        sa.created_at,
        sa.updated_at,
        sa.payment_method_id,
        sa.accepted_payment_method_id,
        sa.scheduled_at,
        sa.meeting,
        sa.scheduled_by,
        sa.cancel_reason_id,
        sa.cancelled_at,
        sa.cancelled_by,
        sa.coordinator_ruid,
        sa.waiting_id,
        sa.meeting_id
    FROM telenutrition.schedule_appointment_history sa
    inner join deident.telenutrition_appointment_mapping tam on tam.appointment_id = sa.appointment_id
    inner join deident.telenutrition_patient_mapping tpm on tpm.patient_id = sa.patient_id
    inner join deident.telenutrition_provider_mapping tprm on tprm.provider_id = sa.provider_id;

create materialized view if not exists deident_telenutrition.schedule_appointment_type as 
    select * from telenutrition.schedule_appointment_type;

create materialized view if not exists deident_telenutrition.schedule_appointment_type_mapping as 
    select * from telenutrition.schedule_appointment_type_mapping;

create materialized view if not exists deident_telenutrition.schedule_consent as 
    SELECT 
        sc.consent_id,
        cim.identity_did as identity_id,
        sc.consent_type,
        sc."version",
        -- sc."source",
        sc.consented_at,
        sc.created_at
    FROM telenutrition.schedule_consent sc
    inner join deident.common_identity_mapping cim on cim.identity_id = sc.identity_id;

create materialized view if not exists deident_telenutrition.schedule_department as 
    select * from telenutrition.schedule_department;

create materialized view if not exists deident_telenutrition.schedule_department_provider as 
    SELECT 
        sdp.department_provider_id,
        sdp.department_id,
        tprm.provider_did
    FROM telenutrition.schedule_department_provider sdp
    inner join deident.telenutrition_provider_mapping tprm on tprm.provider_id = sdp.provider_id;
-- create materialized view if not exists deident_telenutrition.schedule_department_provider_licensed as 
--     select * from telenutrition.schedule_department_provider_licensed;

create materialized view if not exists deident_telenutrition.schedule_employer as 
    SELECT 
        tem.employer_did as employer_id,
        se."label",
        se.special_program,
        se.insurance_package_id,
        se.visible
    FROM telenutrition.schedule_employer se
    inner join deident.telenutrition_employer_mapping tem on tem.employer_id = se.employer_id;

create materialized view if not exists deident_telenutrition.schedule_flow as 
    SELECT 
        sf.flow_id,
        tum.user_did as user_id,
        -- sf.state,
        tpm.patient_did as patient_id,
        tam.appointment_did as appointment_id,
        sf.created_at,
        sf.updated_at,
        sf.scheduled_at,
        -- sf.insurance,
        sf.timezone,
        sf.federation_id,
        sf.flow_type,
        sf.current_step
    FROM telenutrition.schedule_flow sf
    inner join deident.telenutrition_user_mapping tum on tum.user_id = sf.user_id
    inner join deident.telenutrition_patient_mapping tpm on tpm.patient_id = sf.patient_id
    inner join deident.telenutrition_appointment_mapping tam on tam.appointment_id = sf.appointment_id;

create materialized view if not exists deident_telenutrition.schedule_insurance as 
    SELECT
        tim.insurance_did as insurance_id,
        si."label",
        si.package_id,
        si.visible,
        tpaym.payer_did as payer_id,
        si.primary_subscriber_strategy
    FROM telenutrition.schedule_insurance si
    inner join deident.telenutrition_insurance_mapping tim on tim.insurance_id = si.insurance_id
    inner join deident.telenutrition_payer_mapping tpaym on tpaym.payer_id = si.payer_id;

create materialized view if not exists deident_telenutrition.schedule_patient as 
    SELECT 
        tpm.patient_did as patient_id,
        sp.department_id,
        cim.identity_id,
        sp.state,
        -- sp.address,
        -- sp.address2,
        sp.city,
        -- sp.sex,
        -- sp.phone,
        -- sp.email,
        sp.timezone,
        -- sp.first_name,
        -- sp.last_name,
        -- sp.birthday,
        left(sp.zip_code,
3) as zip3,
        sp.created_at,
        -- sp.preferred_name,
        -- sp.pronouns,
        sp."language"
        -- sp.religion
    FROM telenutrition.schedule_patient sp
    inner join deident.telenutrition_patient_mapping tpm on tpm.patient_id = sp.patient_id
    inner join deident.common_identity_mapping cim on cim.identity_id = sp.identity_id;

create materialized view if not exists deident_telenutrition.schedule_patient_payment_method as 
    SELECT 
        sp.payment_method_id,
        tpm.patient_did as patient_id,
        sp."type",
        tem.employer_did as employer_id,
        tim.insurance_did as insurance_id,
        sp.group_id,
        sp.member_id,
        -- "data",
        sp.visible,
        sp.eligible_id,
        sp.status,
        sp.last_eligibility_check_id,
        sp.created_at,
        sp.payment_method_type_id,
        sp.primary_subscriber_member_id,
        sp.primary_subscriber_dob,
        sp.primary_subscriber_relationship,
        sp.sponsor_id
    FROM telenutrition.schedule_patient_payment_method sp
    inner join deident.telenutrition_patient_mapping tpm on tpm.patient_id = sp.patient_id
    inner join deident.telenutrition_employer_mapping tem on tem.employer_id = sp.employer_id
    inner join deident.telenutrition_insurance_mapping tim on tim.insurance_id = sp.insurance_id;

create materialized view if not exists deident_telenutrition.schedule_patient_survey as 
    SELECT 
        sps.patient_survey_id,
        tpm.patient_did as patient_id,
        tam.appointment_did as appointment_id,
        sps.score,
        sps.survey_data,
        sps.created_at
    FROM telenutrition.schedule_patient_survey sps
    inner join deident.telenutrition_patient_mapping tpm on tpm.patient_id = sps.appointment_id 
    inner join deident.telenutrition_appointment_mapping tam on tam.appointment_id = sps.appointment_id;

create materialized view if not exists deident_telenutrition.schedule_provider as 
    SELECT 
        tprm.provider_did as provider_id,
        sp.first_name,
        sp.last_name,
        sp.okta_id,
        sp.email,
        sp.status,
        sp.languages,
        sp.pediatrics,
        sp.weekly_availability,
        sp.certifications,
        -- sp.home_email,
        -- sp.home_phone,
        -- sp.home_zipcode,
        sp.timezone,
        sp.capacity_provider_group,
        sp.npi,
        sp.employment_status,
        sp.medallion_id,
        sp.credentialing_committee_status,
        sp.initial_credentialing_date,
        sp.latest_credentialing_date,
        sp.caqh_number,
        sp.credentialing_step,
        sp.zoom_phone,
        sp.zoom_pmi,
        sp.employee_id,
        sp.display_name,
        sp.experience,
        sp.education,
        sp.background,
        sp.care_philosophy,
        sp.hobbies,
        sp.favorite_foods,
        sp.professional_titles,
        sp.specialties,
        sp.specialty_categories,
        sp.medallion_percent_complete,
        sp.medallion_profile_completion_state,
        sp.medallion_percent_complete_last_checked,
        sp.verification_status,
        sp.verification_status_last_checked,
        sp.zoom_uid,
        sp.rippling_user_id,
        sp.min_patient_age,
        sp.specialty_ids,
        sp.bio
    FROM telenutrition.schedule_provider sp
    inner join deident.telenutrition_provider_mapping tprm on tprm.provider_id = sp.provider_id;

create materialized view if not exists deident_telenutrition.schedule_referral as 
    SELECT 
        trm.referral_did as referral_id,
        sr.referrer_id,
        sr.icd10_codes,
        tam.appointment_did as appointment_id,
        tpm.patient_did as patient_id,
        sr.created_at,
        sr."type",
        sr."data",
        sr.referral_date,
        sr.referred_by,
        sr.referral_status,
        sr.account_id,
        tpaym.payer_did as payer_id,
        sr.source_data,
        cim.identity_did as identity_id,
        sr.referral_external_id,
        sr.referral_external_status,
        -- sr.patient_external_id,
        sr.updated_at,
        sr.referral_action,
        sr.referral_source
    FROM telenutrition.schedule_referral sr
    inner join deident.telenutrition_referral_mapping trm on trm.referral_id = sr.referral_id
    inner join deident.telenutrition_appointment_mapping tam on tam.appointment_id = sr.appointment_id
    inner join deident.telenutrition_patient_mapping tpm on tpm.patient_id = sr.patient_id
    inner join deident.telenutrition_payer_mapping tpaym on tpaym.payer_id = sr.payer_id
    inner join deident.common_identity_mapping cim on cim.identity_id = sr.identity_id;

create materialized view if not exists deident_telenutrition.schedule_referrer as 
    SELECT 
        referrer_id,
        -- first_name,
        -- last_name,
        -- email,
        organization,
        -- credentials,
        org_id
    FROM telenutrition.schedule_referrer;

create materialized view if not exists deident_telenutrition.schedule_slot as
    with unnested as (
        select
            sl.slot_id,
            sl.slot_type,
            tpm.provider_did as provider_id,
            sl.start_timestamp,
            sl.end_timestamp,
            sl.duration,
            unnest(sl.appointment_ids) as appointment_id,
            sl.sync_token,
            sl.created_at,
            sl.updated_at
        from telenutrition.schedule_slot sl
        inner join deident.telenutrition_provider_mapping tpm on tpm.provider_id = sl.provider_id
        ),
    app_map as (
        select 
            u.slot_id,
            u.slot_type,
            u.provider_id,
            u.start_timestamp,
            u.end_timestamp,
            u.duration,
            tam.appointment_did as appointment_did,
            u.sync_token,
            u.created_at,
            u.updated_at
    from unnested u
    inner join deident.telenutrition_appointment_mapping tam on tam.appointment_id = u.appointment_id
    )
    select 
            slot_id,
            slot_type,
            provider_id,
            start_timestamp,
            end_timestamp,
            duration,
            array_agg(appointment_did) as appointment_ids,
            sync_token,
            created_at,
            updated_at
    from app_map
    group by 
            slot_id,
            slot_type,
            provider_id,
            start_timestamp,
            end_timestamp,
            duration,
            sync_token,
            created_at,
            updated_at;

create materialized view if not exists deident_telenutrition.schedule_sponsor as 
    select * from telenutrition.schedule_sponsor;

create materialized view if not exists deident_telenutrition.schedule_user as 
    SELECT 
        tum.user_id,
        su.fs_user_id,
        su.fs_eligible_id,
        su.email
    FROM telenutrition.schedule_user su
    inner join deident.telenutrition_user_mapping tum on tum.user_id = su.user_id;

create materialized view if not exists deident_telenutrition.schedule_user_patient as 
    SELECT
        sup.user_patient_id,
        tum.user_id,
        tpm.patient_id
    FROM telenutrition.schedule_user_patient sup
    inner join deident.telenutrition_user_mapping tum on tum.user_id = sup.user_id
    inner join deident.telenutrition_patient_mapping tpm on tpm.patient_id = sup.patient_id;

create materialized view if not exists deident_telenutrition.state_credentialing_config as 
    select * from telenutrition.state_credentialing_config;

create materialized view if not exists deident_telenutrition.sticky_note as 
    SELECT 
        sn.sticky_note_id,
        sn.parent_note_id,
        tpam.patient_did as patient_id,
        tprm.provider_did as provider_id,
        sn.source_type,
        sn.source_id,
        sn.note_content,
        sn.status,
        sn.is_active,
        sn.created_at,
        sn.updated_at,
        sn.archived_at
    FROM telenutrition.sticky_note sn
    inner join deident.telenutrition_patient_mapping tpam on tpam.patient_id = sn.patient_id
    inner join deident.telenutrition_provider_mapping tprm on tprm.provider_id = sn.provider_id;

create materialized view if not exists deident_telenutrition.wallet as 
    SELECT
        w.wallet_id,
        tum.user_did as user_id,
        w.balance,
        w.created_at
    FROM telenutrition.wallet w
    inner join deident.telenutrition_user_mapping tum on tum.user_id = w.user_id;

create materialized view if not exists deident_telenutrition.wallet_transaction as 
    select * from telenutrition.wallet_transaction;

create materialized view if not exists deident_telenutrition.workramp_contact as 
    SELECT 
        wc.contact_id,
        wc.workramp_contact_id,
        -- email,
        -- first_name,
        -- last_name,
        -- npi,
        tpm.provider_did as provider_id,
        wc.created_at,
        wc.updated_at
    FROM telenutrition.workramp_contact wc
    inner join deident.telenutrition_provider_mapping tpm on tpm.provider_id = wc.provider_id;

create materialized view if not exists deident_telenutrition.workramp_contact_path as 
    select * from telenutrition.workramp_contact_path;

-- migrate:down

drop schema if exists deident_telenutrition cascade;
