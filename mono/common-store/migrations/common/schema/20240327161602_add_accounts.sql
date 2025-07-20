-- migrate:up
INSERT INTO "common"."account"
  ( "account_id", "name", "active" )
VALUES
  ( 63, 'Bank of America', true )
ON CONFLICT DO NOTHING
;

-- migrate:down

