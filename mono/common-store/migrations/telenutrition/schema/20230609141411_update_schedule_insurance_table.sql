-- migrate:up

UPDATE "telenutrition"."schedule_insurance" source
SET label = updates.label
FROM (VALUES
  (5, 'Chorus Community Health Plans (Individual and Family) - Formerly Together with CCHP'),
  (6, 'Chorus Community Health Plans (BadgerCare Plus) - Formerly Childrens Community Health Plan'),
  (20, 'HSCSN (Health Services for Children with Special Needs Inc)')
) as updates(insurance_id, label)
WHERE source.insurance_id = updates.insurance_id;

ALTER TABLE "telenutrition"."schedule_insurance"
ADD COLUMN visible bool NOT NULL DEFAULT true;

UPDATE "telenutrition"."schedule_insurance"
SET visible = false WHERE insurance_id IN (0,11,13,14,15,19);

-- migrate:down
