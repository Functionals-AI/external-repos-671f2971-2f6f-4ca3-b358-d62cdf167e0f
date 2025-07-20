-- migrate:up
INSERT INTO "common"."account"
  ( "account_id", "name", "active", "efile" )
VALUES
  ( 72, 'Amazon - Cigna', true, true )
ON CONFLICT DO NOTHING 
;

INSERT INTO "common"."account_membership"
  ( "account_id", "sql", "type" ) 
VALUES 
  ( 72, '"organization_id" = ''207''', 'Foodsmart' )
ON CONFLICT DO NOTHING 
;

-- migrate:down

