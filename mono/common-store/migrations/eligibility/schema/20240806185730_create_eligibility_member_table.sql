-- migrate:up

CREATE TABLE "common"."eligibility_member" (
	"eligibility_id" int4 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	"account_id" int4 REFERENCES common.account (account_id),
	"identity_id" int4 REFERENCES telenutrition.iam_identity(identity_id),
	"external_member_id" text,
	"eligibility_effective_date" date,
	"eligibility_termination_date" date,
	"eligibility_added_date" date,
	"eligibility_removed_date" date,
	"demographic_first_name" text,
	"demographic_last_name" text,
	"demographic_dob" date CHECK (demographic_dob > '1900-01-01' AND demographic_dob < CURRENT_DATE),
	"demographic_lang" varchar(2) REFERENCES common.language_iso6391 (code),
	"demographic_gender" text,
	"contact_phone" text CHECK (contact_phone ~ '^\+1\d{10}$'),
	"contact_phone_mobile" text CHECK (contact_phone_mobile ~ '^\+1\d{10}$'),
	"contact_phone_home" text CHECK (contact_phone_home ~ '^\+1\d{10}$'),
	"contact_email" text CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
	"location_address_1" text,
	"location_address_2" text,
	"location_city" text,
	"location_state" text REFERENCES common.state (state),
	"location_zipcode" text CHECK (location_zipcode ~ '^\d{5}$'),
	"insurance_group_id" text,
	"insurance_policy_id" text,
	"insurance_effective_date" date,
	"insurance_termination_date" date,
	"insurance_carrier_name" text,
	"insurance_plan_name" text,
	"insurance_plan_tier" text,
	"insurance_lob" text,
	"insurance_is_primary" boolean,
	"insurance_relationship" text,
	"insurance_subscriber_policy_id" text,
	"insurance_subscriber_first_name" text,
	"insurance_subscriber_last_name" text,
	"insurance_subscriber_dob" text,
	"insurance_subscriber_gender" text,
	"comm_optout_email" boolean,
	"comm_optout_phone" boolean,
	"comm_preference" text check(comm_preference in ('email', 'voice', 'sms', 'mail')),
	"source_data" jsonb
);


-- migrate:down

