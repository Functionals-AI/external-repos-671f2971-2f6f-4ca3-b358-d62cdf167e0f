-- migrate:up
INSERT INTO "common"."account"
  ( "account_id", "name", "active" )
VALUES
  ( 59, 'Mass General Brigham (MGB)', true ),
  ( 60, 'Aetna ABHIL', false ),
  ( 61, 'CalOptima', false ),
  ( 62, 'CareOregon', false )
ON CONFLICT DO NOTHING 
;

INSERT INTO "common"."account_membership"
  ( "account_id", "sql", "type" ) 
VALUES 
  ( 59, '"organization_id" = ''203''', 'Foodsmart' ),
  ( 60, '"organization_id" = ''202''', 'Foodsmart' ),
  ( 61, '"organization_id" = ''204''', 'Foodsmart' ),
  ( 62, '"organization_id" = ''191''', 'Foodsmart' )
ON CONFLICT DO NOTHING 
;


-- migrate:down

