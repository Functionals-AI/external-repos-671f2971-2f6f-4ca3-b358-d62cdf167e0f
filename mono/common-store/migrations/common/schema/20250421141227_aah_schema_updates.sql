-- migrate:up

-- new table for referral sources
CREATE TABLE "common"."referral_source" (
  "source" text NOT NULL UNIQUE,
  "description" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("source")
);

-- populate referral_source table
INSERT INTO "common"."referral_source"
  ( "source", "description", "created_at" )
VALUES
  ('teleapp', 'Foodsmart Scheduling App', '2025-04-29 00:00:00'), 
  ('caloptima', 'CalOptima', '2025-04-29 00:00:00'), 
  ('aetna-abhil', 'Aetna ABHIL', '2025-04-29 00:00:00'), 
  ('santa-clara', 'Santa Clara Family Health Plan', '2025-04-29 00:00:00'), 
  ('aah', 'Advocate Aurora Health - Commercial', '2025-04-29 00:00:00'), 
  ('unknown', 'Unknown Source', '2025-04-29 00:00:00')
ON CONFLICT DO NOTHING;

-- trigger for updating 'updated_at' column
ALTER TABLE "common"."referral_source" ADD COLUMN "updated_at" timestamp NULL DEFAULT NOW();
CREATE TRIGGER set_referral_source_updated
BEFORE UPDATE ON common.referral_source
FOR EACH ROW
EXECUTE PROCEDURE common.trigger_set_updated();

-- add source ID column to referral_config
ALTER TABLE "common"."referral_config"
ADD "source" varchar;

ALTER TABLE "common"."referral_config"
ADD FOREIGN KEY ("source") REFERENCES "common"."referral_source"("source");

-- populate source ID based on account ID
UPDATE "common"."referral_config"
SET "source" = (case when "account_id" = 60 then 'aetna-abhil'
					    when "account_id" = 61 then 'caloptima'
					    when "account_id" = 74 then 'santa-clara'
				  		end)
WHERE "account_id" IN (60, 61, 74);


-- make source ID new primary key
ALTER TABLE "common"."referral_config"
DROP CONSTRAINT "referral_config_pkey",
ADD PRIMARY KEY ("source"),
ALTER COLUMN "account_id" DROP NOT NULL;

-- migrate:down

