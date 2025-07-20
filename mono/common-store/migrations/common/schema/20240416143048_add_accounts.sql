-- migrate:up
INSERT INTO "common"."account"
  ( "account_id", "name", "active" )
VALUES
  ( 65, 'IMI Americas', true )
ON CONFLICT DO NOTHING
;

INSERT INTO "common"."account_membership"
  ( "account_id", "sql", "type" ) 
VALUES 
  ( 65, '"organization_id" = ''10'' AND "suborganization_id" = ''4854''', 'Foodsmart' )
ON CONFLICT DO NOTHING 
;

-- migrate:down
