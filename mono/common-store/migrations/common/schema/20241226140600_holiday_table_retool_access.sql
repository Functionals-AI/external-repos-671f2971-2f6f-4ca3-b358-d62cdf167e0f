-- migrate:up 

GRANT SELECT, INSERT, UPDATE, DELETE
ON common.company_holiday
TO svc_retool;

GRANT SELECT
ON common.company_holiday
TO svc_redshift;

-- migrate:down