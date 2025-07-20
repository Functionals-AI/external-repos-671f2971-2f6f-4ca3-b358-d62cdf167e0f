-- migrate:up

CREATE TABLE "telenutrition"."incentive" (
  "incentive_id" serial NOT NULL,
  "label" text NOT NULL check(length(label) < 100),
  "description" text NOT NULL check(length(description) < 500),
  "created_at" timestamp DEFAULT NOW(),
  PRIMARY KEY ("incentive_id")
);

-- migrate:down

