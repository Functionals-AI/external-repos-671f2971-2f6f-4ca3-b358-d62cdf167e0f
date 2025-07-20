CREATE USER svc_common PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE foodsmart TO svc_common;

CREATE USER svc_retool PASSWORD 'postgres';

CREATE USER svc_redshift PASSWORD 'postgres';

CREATE SCHEMA IF NOT EXISTS dbmate;
