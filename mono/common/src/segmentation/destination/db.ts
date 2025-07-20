import { err, ok, Result } from 'neverthrow';
import { ErrCode } from '../../error';
import { IContext } from '../../context';
import * as db from 'zapatos/db';
import * as SegmentService from '../service';
import { IntegrationConfig } from '../integration';

const MTAG = ['common', 'segmentation', 'destination', 'db'];

export async function syncDataToStore(context: IContext, config: IntegrationConfig): Promise<Result<boolean, ErrCode>> {
    const tag = [...MTAG, 'syncDataToStore'];
    const { logger, store: { reader, writer }, } = context;

    logger.info(context, tag, `Syncing segment ${config.segmentId} data to store`);

    try {
        const pool = await reader();
        const wpool = await writer();

        const segmentDefinition = await db.selectExactlyOne('common.segment_definition', { segment_definition_id: config.segmentId }).run(pool);
        const segmentProfile = await db.selectExactlyOne('common.segment_profile', { segment_profile_id: segmentDefinition.segment_profile_id }).run(pool);

        const memberIdsResult = await SegmentService.fetchSegmentMembers(context, segmentDefinition.segment_definition_id);

        if (!memberIdsResult.isOk()) {
            const fetchMembersError = `Failed to fetch segment members for segment ID ${segmentDefinition.segment_definition_id}. Error: ${memberIdsResult.error}`;
            logger.error(context, tag, fetchMembersError);

            return ok(true);
        }

        const [memberIdsToAdd, memberIdsToRemove] = memberIdsResult.value;

        const addRemoveMessage = `Adding ${memberIdsToAdd.length} member(s) to and removing ${memberIdsToRemove.length} member(s) from store`;
        logger.info(context, tag, addRemoveMessage, { segmentRecord: segmentDefinition });

        // insert adds
        if (memberIdsToAdd.length > 0) {
            let query = segmentProfile.query;
            let rule = segmentDefinition.rule;
            let filter = true;
            const idColumnName = segmentProfile.segment_member_id_column;

            const destinationTable = config.destinationDefinition.destinationParameters.table;

            // if the destination table is 'callcenter.lead', update the query and rule and check if the calling list exists
            if (destinationTable === 'callcenter.lead' && segmentProfile.label === 'referrals') {
                logger.info(context, tag, `Destination table is callcenter.lead, updating query/rule and checking if calling list exists`);

                filter = false;
                const callingListId = segmentDefinition.label;

                query = `
                  SELECT
                    II.identity_id,
                    II.account_id,
                    II.eligible_id,
                    TO_CHAR(II.birthday, 'YYYY-MM-DD') AS dob,
                    II.first_name,
                    II.last_name,
                    SP.patient_id,
                    SP.email,
                    IU.user_id,
                    '{' || GUE.mobile_phone || '}' AS phone,
                    TRIM(GUE.person_id) AS member_id,
                    TRIM(GUE.address) AS address,
                    TRIM(GUE.city) AS city,
                    GUE."state",
                    GUE.zip_code AS postal_code,
                    GUE."language" AS lang,
                    'available' AS status,
                    '${callingListId}' AS calling_list_id
                  FROM
                    fq_common_telenutrition.schedule_referral SR
                    LEFT JOIN fq_common_telenutrition.iam_identity II ON SR.identity_id = II.identity_id
                    LEFT JOIN fq_common_telenutrition.schedule_patient SP ON SP.identity_id = II.identity_id
                    LEFT JOIN fq_common_telenutrition.iam_user IU ON IU.identity_id = II.identity_id
                    LEFT JOIN fq_foodapp_tenants.go_users_eligible GUE ON GUE.id = II.eligible_id
                `;

                // disambiguate the referral_status and account_id columns                
                rule = rule.replace('referral_status', 'SR.referral_status');
                rule = rule.replace('account_id', 'II.account_id');

                rule += `
                  AND IU.user_id IS NULL
                  AND SP.patient_id IS NULL
                  AND GUE.id NOT IN (
                    SELECT
                      eligible_id
                    FROM
                      fq_common_callcenter.lead
                    WHERE
                      calling_list_id = '${callingListId}'
                  )
                `;

                // check if the calling_list_id already exists in callcenter.calling_list
                const callingListExistsQuery =
                    `
                  SELECT calling_list_id
                  FROM callcenter.calling_list
                  WHERE calling_list_id = $1;
                `;

                const callingListExistsResult = await wpool.query(callingListExistsQuery, [callingListId]);

                // if the calling_list_id does not exist, insert it
                if (callingListExistsResult.rowCount === 0) {
                    logger.info(context, tag, `Creating calling list ${callingListId} since does not exist in callcenter.calling_list`);

                    const insertCallingListQuery =
                        `
                      INSERT INTO callcenter.calling_list (calling_list_id)
                      VALUES ($1);
                    `;

                    await wpool.query(insertCallingListQuery, [callingListId]);
                }
            }

            const dataRes = await SegmentService.fetchSegmentMemberData(context, query, rule, idColumnName, memberIdsToAdd, filter);

            if (dataRes.isErr()) {
                logger.error(context, tag, 'Failed to fetch segment member data', { segmentDefinition, memberIdsToAdd });
                return err(ErrCode.SERVICE);
            }

            let data = dataRes.value;

            if (data.length === 0) {
                if (destinationTable === 'callcenter.lead') {
                    logger.info(context, tag, `No new members to add to calling list ${segmentDefinition.label}`);

                    return ok(true);
                } else {
                    logger.error(context, tag, 'No data fetched to sync', { segmentDefinition, memberIdsToAdd });
                    return err(ErrCode.SERVICE);
                }
            }

            // get the column names from the first row of data
            // e.g. ['id', 'name']
            const columnNames = Object.keys(data[0]);

            // if we have any hard-coded columns (from destination mapping config), add them to the column names and data
            if (config.destinationConfig?.staticColumns) {
                logger.info(context, tag, 'Adding static columns to segment member data', { staticColumns: config.destinationConfig.staticColumns });

                columnNames.push(...config.destinationConfig.staticColumns.map((col) => col.name));

                data = data.map((row) => ({
                    ...row,
                    ...config.destinationConfig!.staticColumns!.reduce((acc, col) => {
                        acc[col.name] = col.value;
                        return acc;
                    }, {} as Record<string, any>)
                }));
            }

            // build the parameterized values string for the insert query
            // e.g. ($1, $2), ($3, $4), ...
            const valueParams = data.map((_, i) =>
                `(${columnNames.map((_, j) =>
                    `$${i * columnNames.length + j + 1}`
                ).join(", ")})`
            ).join(", ");

            // construct the insert query
            // e.g. INSERT INTO destinationTable (id, name) VALUES ($1, $2), ($3, $4), ...
            const insertQuery = `
            INSERT INTO ${destinationTable} (${columnNames.join(", ")})
            VALUES ${valueParams}
            RETURNING ${idColumnName};
            `;

            // flatten the data into a single array of values
            // e.g. [1, 'Alice', 2, 'Bob', ...]
            const values = data.flatMap(Object.values);

            // run the query with the values
            // e.g. INSERT INTO destinationTable (id, name) VALUES (1, 'Alice'), (2, 'Bob'), ...
            const insertResult = await wpool.query(insertQuery, values);

            logger.info(context, tag, `Inserted ${insertResult.rowCount} segment member(s) into ${destinationTable}`, { ids: insertResult.rows });
        }

        // delete removes if configured to do so
        if (memberIdsToRemove.length > 0 && config.destinationDefinition.destinationParameters.delete) {
            const destinationTable = config.destinationDefinition.destinationParameters.table;
            const idColumnName = segmentProfile.segment_member_id_column;

            const columnType = segmentProfile.profile_schema![idColumnName];

            if (config.destinationDefinition.destinationParameters.delete === 'closed') {
                const closeQuery = `
                    UPDATE ${destinationTable}
                    SET status = 'closed'
                    WHERE ${idColumnName} = ANY($1::${columnType}[])
                    RETURNING ${idColumnName};
                `;

                const closeResult = await wpool.query(closeQuery, [memberIdsToRemove]);

                logger.info(context, tag, `Set ${closeResult.rowCount} segment member(s) to 'closed' status in ${destinationTable}`, { ids: closeResult.rows });
            } else {
                const deleteQuery = `
                    DELETE FROM ${destinationTable}
                    WHERE ${idColumnName} = ANY($1::${columnType}[])
                    RETURNING ${idColumnName};
                `;

                const deleteResult = await wpool.query(deleteQuery, [memberIdsToRemove]);

                logger.info(context, tag, `Deleted ${deleteResult.rowCount} segment member(s) from ${destinationTable}`, { ids: deleteResult.rows });
            }
        } else if (memberIdsToRemove.length > 0) {
            logger.info(context, tag, 'Destination parameters not configured to delete members from store', { destinationParameters: config.destinationDefinition.destinationParameters });
        }

        return ok(true);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}