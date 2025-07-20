-- migrate:up
UPDATE "telenutrition"."schedule_insurance"
    SET visible = TRUE, package_id = 296947
    WHERE insurance_id = 5;

UPDATE "telenutrition"."schedule_insurance"
    SET label = 'Chorus Community Health Plans (BadgerCare Plus) - Formerly Childrens Community Health Plan'
    WHERE insurance_id = 6;

-- migrate:down

