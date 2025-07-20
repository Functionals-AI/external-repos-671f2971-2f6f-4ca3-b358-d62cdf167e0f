-- migrate:up

CREATE TABLE "telenutrition"."wallet" (
  "wallet_id" serial,
  "user_id" int4 NOT NULL,
  "balance" money NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  CONSTRAINT wallet_user_id_idx UNIQUE (user_id),
  PRIMARY KEY ("wallet_id"),
  CONSTRAINT fk_user_id
    FOREIGN KEY(user_id)
    REFERENCES telenutrition.iam_user(user_id)
);

-- migrate:down

