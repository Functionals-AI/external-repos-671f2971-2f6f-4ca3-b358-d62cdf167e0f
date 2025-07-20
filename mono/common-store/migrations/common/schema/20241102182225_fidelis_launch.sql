-- migrate:up
INSERT INTO "common"."account"
  ( "account_id", "name", "active", "efile" )
VALUES
  ( 73, 'Fidelis Care', true, true )
ON CONFLICT DO NOTHING 
;

INSERT INTO "common"."account_membership"
  ( "account_id", "sql", "type" ) 
VALUES 
  ( 73, '"organization_id" = ''208''', 'Foodsmart' )
ON CONFLICT DO NOTHING 
;

-- migrate:down

