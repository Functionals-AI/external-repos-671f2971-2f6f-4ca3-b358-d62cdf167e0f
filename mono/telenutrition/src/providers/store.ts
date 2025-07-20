import { IContext } from "@mono/common/src/context";
import { Result, err, ok } from "neverthrow";
import { ErrCode } from "@mono/common/lib/error"
import * as db from "zapatos/db";
import * as zs from 'zapatos/schema'
import { Logger } from "@mono/common";
import { ProviderProfileStateEntry } from './service'

const MTAG = Logger.tag();

async function fetchAllProviderPublicProfiles (context: IContext): Promise<Result<ProviderProfileStateEntry[], ErrCode>> {
    const { logger, store: { reader } } = context;
    const TAG = [...MTAG, 'fetchAllProviderPublicProfiles']

    try {
        const pool = await reader();
        const profiles = await db.sql<zs.telenutrition.schedule_provider.SQL | zs.telenutrition.schedule_department.SQL, ProviderProfileStateEntry[]>`
            SELECT
                "telenutrition"."schedule_provider".provider_id AS providerId,
                "telenutrition"."schedule_provider".first_name AS firstName,
                "telenutrition"."schedule_provider".last_name AS lastName,
                "telenutrition"."schedule_department".state,
                "telenutrition"."schedule_provider".languages,
                "telenutrition"."schedule_provider".specialties,
                "telenutrition"."schedule_provider".specialty_categories AS specialtyCategories,
                "telenutrition"."schedule_provider".display_name AS displayName,
                "telenutrition"."schedule_provider".background,
                "telenutrition"."schedule_provider".care_philosophy AS carePhilosophy,
                "telenutrition"."schedule_provider".hobbies,
                "telenutrition"."schedule_provider".favorite_foods AS favoriteFoods,
                "telenutrition"."schedule_provider".experience,
                "telenutrition"."schedule_provider".education,
                "telenutrition"."schedule_provider".professional_titles AS professionalTitles
            FROM "telenutrition"."schedule_provider"
            INNER JOIN "telenutrition"."schedule_department_provider"
            ON "telenutrition"."schedule_provider".provider_id = "telenutrition"."schedule_department_provider".provider_id
            INNER JOIN "telenutrition"."schedule_department"
            ON "telenutrition"."schedule_department_provider".department_id = "telenutrition"."schedule_department".department_id
            ORDER BY "telenutrition"."schedule_provider".provider_id
        `.run(pool);

        if (!profiles) {
            logger.error(context, TAG, 'could not retrieve provider profiles')
            return err(ErrCode.NOT_FOUND);
        }

        return ok(profiles);
    } catch (e) {
        logger.exception(context, TAG, e);
        return err(ErrCode.EXCEPTION);
    }
}

export default {
    fetchAllProviderPublicProfiles,
}
