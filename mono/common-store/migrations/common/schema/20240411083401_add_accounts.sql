-- migrate:up
INSERT INTO "common"."account"
  ( "account_id", "name", "active" )
VALUES
  ( 64, 'Samaritan', true )
ON CONFLICT DO NOTHING
;

INSERT INTO "common"."account_membership"
  ( "account_id", "sql", "type" ) 
VALUES 
  ( 64, '"organization_id" = ''206''', 'Foodsmart' )
ON CONFLICT DO NOTHING 
;

-- migrate:down
