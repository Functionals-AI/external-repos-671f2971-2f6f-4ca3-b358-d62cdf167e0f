-- migrate:up
CREATE OR REPLACE PROCEDURE refresh_all_materialized_views(schema_name VARCHAR)
LANGUAGE plpgsql
AS $$
DECLARE
  v RECORD;
BEGIN
  FOR v IN
    SELECT n.nspname AS schemaname, c.relname AS viewname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'v'
      AND pg_get_viewdef(c.oid) LIKE '%MATERIALIZED VIEW%'
      AND n.nspname = schema_name
  LOOP
    RAISE NOTICE 'Refreshing %.%', v.schemaname, v.viewname;
    EXECUTE 'REFRESH MATERIALIZED VIEW ' || v.schemaname || '.' || v.viewname;
  END LOOP;
END;
$$;


-- migrate:down

