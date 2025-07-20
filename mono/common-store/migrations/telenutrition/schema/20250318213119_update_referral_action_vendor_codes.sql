-- migrate:up

UPDATE telenutrition.schedule_referral
SET
    referral_action = (
        SELECT
            jsonb_agg(
                COALESCE(
                    jsonb_set(
                        elem,
                        '{data,vendor}',
                        to_jsonb(
                            CASE
                                WHEN elem -> 'data' ->> 'vendor' = 'mealsonwheels' THEN 'meals_on_wheels'
                                WHEN elem -> 'data' ->> 'vendor' = 'gafoods' THEN 'ga_foods'
                                ELSE elem -> 'data' ->> 'vendor'
                            END
                        )
                    ),
                    elem
                )
            )
        FROM
            jsonb_array_elements(referral_action) AS elem
    )
WHERE
    referral_action IS NOT NULL
    AND account_id = 61;

-- migrate:down

