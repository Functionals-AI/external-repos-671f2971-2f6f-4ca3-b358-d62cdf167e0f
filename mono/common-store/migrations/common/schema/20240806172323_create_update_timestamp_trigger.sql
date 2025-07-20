-- migrate:up

CREATE OR REPLACE FUNCTION common.update_timestamp()
RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- migrate:down

