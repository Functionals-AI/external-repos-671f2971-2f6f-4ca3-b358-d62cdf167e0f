# Referrals

## Overview

There are two flavors of referrals:

  * **Inbound Referrals**: A referral received by Foodsmart.
  * **Outbound Referrals**: As a result of an **inbound referral** which is received, an **outbound referral** may get created. For example, an **outbound referral** for a medically tailored meal may get generated.

### Inbound Referrals

**Inbound referrals** can be received via the following sources:
  * The Telenutrition Application as a form submission: [foodsmart.com/schedule/referral](https://foodsmart.com/schedule/referral),
  * External entities which send us referral along with eligibility dasta. The following sources are currently active:
    * [CalOptima](./sources/caloptimma/)
    * Aetna ABHIL
    * Quartz

**Inbound referrals** have a lifecycle with specific set of valid state statuses. Statuses include:
  * NULL: Initial state.
  * requested: Initial state when a referral is received.
  * invalid: Validation has failed. (Details are unclear.)
  * declined: The reverral cannot be accepted. For example, it may be a duplicate of a previously received referral.
  * accepted: A requested referral has been **accepted**.  This implies Foodsmart will reach out to the referred party to schedule an appointment.
  * in-progress: An appointment has been cheduled for the referral. 
  * completed: The referral has had a scheduled appointment completed.

Valid referral state transitions include:

  * NULL -> requested
  * NULL -> invalid
  * requested -> declined 
  * requested -> accepted
  * accepted -> in-progress
  * in-progress -> completed

### Outbound Referrals

## Service

## Sources

### CalOptimma Connect

## Store

### telenutrition.schedule_referral

Referrals are persisted in Postgres, in the **telenutrition.schedule_referral** table. The **telenutrition.schedule_referral** table represents an **inbound referral**. 

As of this writing, the table has this scheema:

```
CREATE TABLE "telenutrition"."schedule_referral" (
    "referral_id" int4 NOT NULL DEFAULT nextval('telenutrition.schedule_referrer_id_seq'::regclass),
    "referrer_id" int4,
    "icd10_codes" _varchar,
    "appointment_id" int4,
    "patient_id" int4,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "type" varchar(20) DEFAULT 'referral'::character varying,
    "data" jsonb,
    "referral_date" date,
    "referred_by" text,
    "referral_status" text,
    "account_id" int4,
    "payer_id" int4,
    "source_data" jsonb,
    "identity_id" int4,
    "referral_external_id" text,
    "referral_external_status" text,
    "patient_external_id" text,
    "referral_action" jsonb,
    "updated_at" timestamp NOT NULL DEFAULT now(),
    CONSTRAINT "schedule_referral_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "telenutrition"."payer"("payer_id"),
    CONSTRAINT "schedule_referral_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "telenutrition"."iam_identity"("identity_id"),
    CONSTRAINT "schedule_referral_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "common"."account"("account_id"),
    PRIMARY KEY ("referral_id")
);
```

Please not the following with respect to specific columns:
  * type: 
  * referrer_id: Represents the entity submitting an **inbound referral** via the telenutrition appoolicaiton. Primary key of the **telenutrition.schedule_referrer** row.
  * referred_by: Text describing the referring entity. Values include:
    * Mail
    * Ads
    * Online
    * Names of individuals
    * Husband / Wife
    * Organizations, ie: Bento
  * referral_date: The date the **inbound referral** was received.
  * referral_status ::= NULL | 'requested' | 'invalid' | 'declined' | 'in-progress' | 'completed' | 'accepted'
  * referral_action: 
  * referral_external_id:
  * patient_external_id: 
  * referral_external_status:
  * identity_id: 
  * account_id: 