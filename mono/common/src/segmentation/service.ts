import { err, ok, Result } from 'neverthrow';
import { ErrCode } from '../error';
import { IContext } from '../context';
import * as _ from 'lodash';
import * as db from 'zapatos/db';
import * as zs from 'zapatos/schema';
import { typeMap } from './postgres-types';
import * as Integration from './integration';
import { formatDuration } from './utils';
import { Pool } from 'pg';

const MTAG = ['common', 'segmentation', 'service'];

export interface columnMetadata {
    [columnName: string]: string;
}

export interface Condition {
    columnName: string;
    operator: string;
    value: string;
}

// methods for segment and segment members

async function getRsColumnMetadata(context: IContext, sql: string): Promise<Result<{ [columnName: string]: string }, ErrCode>> {
    const tag = [...MTAG, 'getRsColumnMetadata'];
    const { logger, redshift } = context;
    const metadata: { [columnName: string]: string } = {};

    try {
        const pool = await redshift();
        const sql_new = `${sql} LIMIT 1`;

        const queryResult = await pool.query(sql_new);

        if (queryResult != null) {
            queryResult.fields.forEach((field) => {
                const pgType = typeMap[field.dataTypeID];
                metadata[field.name] = pgType;
            });
        }

        return ok(metadata);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

async function getPgColumnMetadata(context: IContext, sql: string): Promise<Result<{ [columnName: string]: string }, ErrCode>> {
    const tag = [...MTAG, 'getPgColumnMetadata'];
    const { logger, store: { reader }, } = context;

    const metadata: { [columnName: string]: string } = {};

    try {
        const pool = await reader();
        const sql_new = `${sql} LIMIT 1`;

        const queryResult = await pool.query(sql_new);

        if (queryResult.rowCount != null) {
            queryResult.fields.forEach((field) => {
                const postgresType = typeMap[field.dataTypeID];
                metadata[field.name] = postgresType;
            });
        }

        return ok(metadata);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

export async function createSegmentProfile(context: IContext, sql: string, description: string, label: string, segmentMemberIdColumn: string): Promise<Result<boolean, ErrCode>> {
    const tag = [...MTAG, 'postSegmentProfile'];
    const { logger, store: { writer }, } = context;

    try {
        const unwrappedSql = atob(sql);

        if (unwrappedSql.includes('fq_common')) {
            const columnSchema = await getRsColumnMetadata(context, unwrappedSql);
            const profileSchema = typeof columnSchema['value'] === 'object' ? JSON.stringify(columnSchema['value']) : columnSchema['value'];

            const insertable: zs.common.segment_profile.Insertable = {
                profile_schema: profileSchema,
                query: unwrappedSql,
                description: description,
                label: label,
                segment_member_id_column: segmentMemberIdColumn,
            };

            const pool = await writer();
            await db.insert('common.segment_profile', insertable).run(pool);

            return ok(true);
        } else {
            const columnSchema = await getPgColumnMetadata(context, unwrappedSql);
            const profileSchema = typeof columnSchema['value'] === 'object' ? JSON.stringify(columnSchema['value']) : columnSchema['value'];

            const insertable: zs.common.segment_profile.Insertable = {
                profile_schema: profileSchema,
                query: unwrappedSql,
                description: description,
                label: label,
                segment_member_id_column: segmentMemberIdColumn,
            };

            const pool = await writer();
            await db.insert('common.segment_profile', insertable).run(pool);

            return ok(true);
        }
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

export async function previewSegmentSchema(context: IContext, sql: string) {
    const tag = [...MTAG, 'previewSegmentSchema'];
    const { logger } = context;

    try {
        if (sql.includes('fq_common')) {
            const columnSchema = await getRsColumnMetadata(context, sql);
            return ok(columnSchema);
        } else {
            const columnSchema = await getPgColumnMetadata(context, sql);
            return ok(columnSchema);
        }
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

export async function updateSegmentProfile(context: IContext, segmentProfileId: number, sql: string): Promise<Result<boolean, ErrCode>> {
    const tag = [...MTAG, 'updateSegmentProfile'];
    const { logger, store: { writer }, } = context;

    try {
        const unwrappedSql = atob(sql);

        const columnSchema = await getPgColumnMetadata(context, unwrappedSql);
        const profileSchema = typeof columnSchema['value'] === 'object' ? JSON.stringify(columnSchema['value']) : columnSchema['value'];
        const pool = await writer();

        await db.update(
            'common.segment_profile',
            {
                profile_schema: profileSchema,
                query: unwrappedSql,
            },
            { segment_profile_id: segmentProfileId },
        ).run(pool);

        return ok(true);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

export async function createSegment(context: IContext, segmentProfileId: number, ruleSet: string, label: string, schedule: string, description: string) {
    const tag = [...MTAG, 'createSegment'];
    const { logger, store: { reader, writer }, } = context;

    try {
        const pool = await reader();

        const segmentProfileRecord = await db.selectExactlyOne('common.segment_profile', { segment_profile_id: segmentProfileId }).run(pool);

        const rules = atob(ruleSet);
        const profileSchemaJson = segmentProfileRecord.profile_schema;

        const map = new Map<string, any>(Object.entries(profileSchemaJson || {}));
        await validateWhereClause(context, rules, map);

        const insertable: zs.common.segment_definition.Insertable = {
            segment_profile_id: segmentProfileId,
            rule: `${rules}`,
            label,
            schedule,
            description,
        };

        const writerPool = await writer();

        await db.insert('common.segment_definition', insertable).run(writerPool);

        return ok(true);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

export async function deleteSegment(context: IContext, segmentId: number): Promise<Result<boolean, ErrCode>> {
    const tag = [...MTAG, 'deleteSegment'];
    const { logger, store: { writer }, } = context;

    try {
        const pool = await writer();

        await db.deletes('common.segment_definition', { segment_definition_id: segmentId }).run(pool);

        return ok(true);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

async function validateWhereClause(context: IContext, whereClause: string, columnMap: Map<string, any>): Promise<Result<boolean, ErrCode>> {
    const tag = [...MTAG, 'validateWhereClause'];
    const { logger } = context;

    const regex = /\b(\w+)\b\s*(=|>|<|<=|>=|!=|like|ilike)\s*('[^']*'|[0-9]+)/gi;
    const conditions: Condition[] = [];
    let match;

    try {
        while ((match = regex.exec(whereClause)) !== null) {
            const columnName = match[1];
            const operator = match[2];
            const value = match[3].toString().replace(/'/g, '');
            conditions.push({ columnName, operator, value });
        }

        if (!conditions) {
            throw new Error('Invalid WHERE clause');
        }

        const numericOperators = ['=', '!=', '<>', '<', '>', '<=', '>='];
        const numericDataTypes = ['int4', 'int2', 'int8', 'float4', 'float8', 'date'];

        conditions.forEach((condition) => {
            const { columnName, operator, value } = condition;

            if (!columnMap.has(columnName)) {
                throw new Error(`Column ${columnName} not found in column map`);
            }

            const columnDataType = columnMap.get(columnName);

            if (operator === 'like' && columnDataType !== 'text') {
                throw new Error(`Invalid condition for column "${columnName}". Expected type: text`);
            } else if (numericOperators.includes(operator) && numericDataTypes.includes(columnDataType)) {
                if (isNaN(Number(value)) && !value.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    throw new Error(`Invalid condition value for column "${columnName}". Expected type: ${columnDataType}`);
                }
            } else if (columnDataType == 'bpchar' && value.length > 2) {
                throw new Error(`Invalid state abbrevation for column "${columnName}". Expected value like CA, AZ etc`);
            }
        });

        return ok(true);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

export async function createSegmentMember(context: IContext, segmentId: number, segmentSyncId: number, memberIds: number[] | null, wpool?: Pool): Promise<Result<boolean, ErrCode>> {
    const tag = [...MTAG, 'createSegmentMember'];
    const { logger, store: { writer }, } = context;

    if (!memberIds || memberIds.length === 0) {
        logger.info(context, tag, `No members to add for segment ${segmentId}`);
        return ok(false);
    }

    try {
        logger.info(context, tag, `Adding ${memberIds.length} member(s) to segment ${segmentId}`);

        const segmentMemberInsertables = memberIds.map((memberId) => ({
            segment_definition_id: segmentId,
            segment_sync_id: segmentSyncId,
            member_id: memberId,
        }));

        const pool = wpool || await writer();

        await db.insert('common.segment_member', segmentMemberInsertables).run(pool);

        const segmentMemberHistoryInsertables = memberIds.map((memberId) => ({
            segment_definition_id: segmentId,
            segment_sync_id: segmentSyncId,
            member_id: memberId,
            operation: 'add',
        }));

        await db.insert('common.segment_member_history', segmentMemberHistoryInsertables).run(pool);

        if (!wpool) {
            await pool.end();
        }

        return ok(true);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

export async function deleteSegmentMember(context: IContext, segmentId: number, segmentSyncId: number, memberIds: number[] | null, wpool?: Pool): Promise<Result<boolean, ErrCode>> {
    const tag = [...MTAG, 'deleteSegmentMember'];
    const { logger, store: { writer }, } = context;

    if (!memberIds || memberIds.length === 0) {
        logger.info(context, tag, `No members to delete for segment ${segmentId}`);
        return ok(false);
    }

    try {
        logger.info(context, tag, `Deleting ${memberIds.length} member(s) from segment ${segmentId}`);

        const segmentMemberHistoryInsertables = memberIds.map((memberId) => ({
            segment_definition_id: segmentId,
            segment_sync_id: segmentSyncId,
            member_id: memberId,
            operation: 'remove',
        }));

        const pool = wpool || await writer();

        await db.insert('common.segment_member_history', segmentMemberHistoryInsertables).run(pool);

        await db.deletes('common.segment_member', {
            segment_definition_id: segmentId,
            member_id: db.conditions.isIn(memberIds),
        }).run(pool);

        if (!wpool) {
            await pool.end();
        }

        return ok(true);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

export async function getDueSegmentIds(context: IContext): Promise<Result<number[], ErrCode>> {
    const tag = [...MTAG, 'getDueSegmentIds'];
    const { logger, store: { reader }, } = context;

    try {
        logger.info(context, tag, `Checking for segments with a sync due`);

        const pool = await reader();
        let dueSegmentIds: number[] = [];

        //get all segment_definition rows
        const segmentDestinationMappings = await db.select('common.segment_definition', {}).run(pool);

        const query = db.sql<Date[]>`SELECT NOW()::timestamp AS current_time`;
        const result = await query.run(pool);
        const now = new Date(result[0]?.current_time).getTime();

        for (const {
            segment_definition_id: segmentDefinitionId,
        } of segmentDestinationMappings) {
            logger.info(context, tag, `Checking if segment ${segmentDefinitionId} is due for sync`);

            const segmentSyncRows = await db.select('common.segment_sync', {
                segment_definition_id: segmentDefinitionId,
                sync_status: 'completed',
            }, {
                order: { by: 'created_at', direction: 'DESC' },
                limit: 1
            }).run(pool);

            const lastSegmentSync = segmentSyncRows[0];

            if (!lastSegmentSync) {
                logger.info(context, tag, `No completed sync found for segment ${segmentDefinitionId}, adding to due list`);

                dueSegmentIds.push(segmentDefinitionId);
            } else {
                // get segment_definition row, we need the schedule
                const segmentDefinition = await db.selectExactlyOne('common.segment_definition', { segment_definition_id: segmentDefinitionId }).run(pool);

                // Skip if the segment schedule is 'one time'
                if (segmentDefinition.schedule.replace(/[\s\-_]/g, '').toLowerCase() === 'onetime') {
                    logger.info(context, tag, `Segment ${segmentDefinitionId} is one-time and does not require further syncs`);

                    continue;
                }

                // Parse the rate string
                const match = segmentDefinition.schedule.match(/^rate\((\d+)\s+(minute|hour|day|minutes|hours|days)\)$/);

                if (!match) {
                    logger.error(context, tag, `Invalid rate format for segment ${segmentDefinitionId}`);

                    continue;
                }

                const [_, value, unit] = match;
                const interval = parseInt(value, 10);

                if (isNaN(interval) || interval <= 0) {
                    logger.error(context, tag, `Rate value must be a positive integer for segment ${segmentDefinitionId} (value: ${value})`);

                    continue;
                }

                let rateMillis: number;

                switch (unit) {
                    case "minute":
                    case "minutes":
                        rateMillis = interval * 60 * 1000;
                        break;
                    case "hour":
                    case "hours":
                        rateMillis = interval * 60 * 60 * 1000;
                        break;
                    case "day":
                    case "days":
                        rateMillis = interval * 24 * 60 * 60 * 1000;
                        break;
                    default:
                        throw new Error("Unsupported time unit.");
                }

                const lastRun = new Date(lastSegmentSync.created_at).getTime();

                // Check if enough time has passed since the last run
                if (now - lastRun >= rateMillis) {
                    logger.info(context, tag, `Segment ${segmentDefinitionId} is due for sync`);

                    dueSegmentIds.push(segmentDefinitionId);
                } else {
                    logger.info(context, tag, `Segment ${segmentDefinitionId} is not due for sync (due in ${formatDuration(rateMillis - (now - lastRun))})`);
                }
            }
        }

        return ok(dueSegmentIds);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

export async function syncAllSegments(context: IContext, segmentIds: number[] = []): Promise<Result<boolean, ErrCode>> {
    const tag = [...MTAG, 'syncAllSegments'];
    const { logger, store: { reader }, } = context;

    try {
        logger.info(context, tag, `Syncing ${segmentIds.length ? segmentIds.length + ' selected segment(s)' : 'all segments'}`);

        const pool = await reader();

        const segmentDefinitions = segmentIds.length
            ? await db.select('common.segment_definition', { segment_definition_id: db.conditions.isIn(segmentIds) }).run(pool)
            : await db.select('common.segment_definition', {}).run(pool);

        logger.info(context, tag, `Found ${segmentDefinitions.length} segment(s) to sync`);

        for (const segmentDefinition of segmentDefinitions) {
            logger.info(context, tag, `Syncing segment ${segmentDefinition.segment_definition_id} (${segmentDefinition.label})`);

            const syncSegmentResult = await syncSegment(context, segmentDefinition.segment_definition_id);

            if (syncSegmentResult.isErr()) {
                logger.error(context, tag, `Failed to sync segment ${segmentDefinition.segment_definition_id}.`, syncSegmentResult);
                return err(syncSegmentResult.error);
            }

            if (syncSegmentResult.value) {
                const syncSegmentDestinationResult = await syncSegmentDestination(context, segmentDefinition.segment_definition_id);

                if (syncSegmentDestinationResult.isErr()) {
                    logger.error(context, tag, `Failed to sync segment destinations for segment ${segmentDefinition.segment_definition_id}.`, syncSegmentDestinationResult);
                    return err(syncSegmentDestinationResult.error);
                }
            } else {
                logger.info(context, tag, `No changes to sync to destination(s) for segment ${segmentDefinition.segment_definition_id}`);
            }

            logger.info(context, tag, `Finished syncing segment ${segmentDefinition.segment_definition_id} (${segmentDefinition.label})`);
        }

        logger.info(context, tag, `Finished syncing ${segmentDefinitions.length} segment(s)`);

        return ok(true);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

export async function createSegmentSync(context: IContext, segmentId: number): Promise<Result<number, ErrCode>> {
    const tag = [...MTAG, 'createSegmentSync'];
    const { logger, store: { writer }, } = context;

    try {
        const insertable: zs.common.segment_sync.Insertable = {
            segment_definition_id: segmentId,
            sync_status: 'pending',
        };

        const pool = await writer();
        const inserted = await db.insert('common.segment_sync', insertable).run(pool);

        logger.info(context, tag, `Created new sync record for segment ${segmentId}`);

        return ok(inserted.segment_sync_id);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

export async function syncSegment(context: IContext, segmentId: number): Promise<Result<boolean, ErrCode>> {
    const tag = [...MTAG, 'syncSegment'];
    const { logger, store: { reader, writer }, } = context;

    try {
        logger.info(context, tag, `Performing sync segment actions for segment ${segmentId}`);

        const pool = await reader();
        const wpool = await writer();

        const segmentDefinition = await db.selectExactlyOne('common.segment_definition', { segment_definition_id: segmentId }).run(pool);
        const segmentProfile = await db.selectExactlyOne('common.segment_profile', { segment_profile_id: segmentDefinition.segment_profile_id }).run(pool);

        let segmentSyncRecord = await db.select('common.segment_sync', {
            segment_definition_id: segmentId,
            sync_status: db.sql<zs.common.segment_sync.SQL>`sync_status = 'pending' or sync_status = 'failed'`,
        }).run(pool);

        let segmentSyncId = segmentSyncRecord[0]?.segment_sync_id;

        if (segmentSyncRecord.length === 0) {
            logger.info(context, tag, `No pending or failed sync record found for segment ${segmentId}`);

            const createSegmentSyncResult = await createSegmentSync(context, segmentDefinition.segment_definition_id);

            if (createSegmentSyncResult.isErr()) {
                logger.error(
                    context,
                    tag,
                    `Failed to create segment sync record for segment ${segmentDefinition.segment_definition_id}. Error: ${createSegmentSyncResult.error}`,
                );

                return err(createSegmentSyncResult.error);
            }

            if (createSegmentSyncResult.value) {
                segmentSyncId = createSegmentSyncResult.value;

                if (isNaN(segmentSyncId)) {
                    logger.error(context, tag, `Failed to create segment sync record for segment ${segmentId}. Returned ID is not a number.`);

                    return err(ErrCode.EXCEPTION);
                }
            }
        } else if (segmentSyncRecord.length > 1) {
            logger.error(context, tag, `Multiple pending or failed sync records found for segment ${segmentId}`);

            return err(ErrCode.EXCEPTION);
        }

        const query = segmentProfile.query;
        const rule = segmentDefinition.rule;
        const segmentProfileId = segmentDefinition.segment_profile_id;

        const segmentProfileRecord = await db.selectExactlyOne('common.segment_profile', { segment_profile_id: segmentProfileId }).run(pool);

        const [currentMembersResult, previousMembersResult] = await Promise.all([
            fetchCurrentSegmentMembers(context, query, rule, segmentProfileRecord.segment_member_id_column || ''),
            fetchPreviousSegmentMembers(context, segmentId),
        ]);

        if (currentMembersResult.isOk() && previousMembersResult.isOk()) {
            const currentMembers = currentMembersResult.value;
            const previousMembers = previousMembersResult.value;

            const { membersToAdd, membersToRemove } = getMemberDifferences(previousMembers, currentMembers);

            // Process additions and deletions in chunks
            const CHUNK_SIZE = 5000;
            const MAX_CONCURRENCY = 5;

            const addResult = await processChunksWithTracking(
                membersToAdd,
                CHUNK_SIZE,
                async (chunk) => createSegmentMember(context, segmentId, segmentSyncId, chunk, wpool),
                MAX_CONCURRENCY
            );

            const removeResult = await processChunksWithTracking(
                membersToRemove,
                CHUNK_SIZE,
                async (chunk) => deleteSegmentMember(context, segmentId, segmentSyncId, chunk, wpool),
                MAX_CONCURRENCY
            );

            const stats = {
                membersAdded: addResult.successCount,
                membersRemoved: removeResult.successCount,
            };

            if (!addResult.error && !removeResult.error) {
                // Both operations succeeded
                await db.update(
                    'common.segment_sync',
                    { sync_status: 'completed', stats: stats },
                    { segment_sync_id: segmentSyncId },
                ).run(wpool);

                if (membersToAdd.length === 0 && membersToRemove.length === 0) {
                    return ok(false);
                }
            } else {
                // One or both operations failed
                logger.error(
                    context,
                    tag,
                    `Failed to add or remove all members. Add error: ${addResult.error}, Remove error: ${removeResult.error}`
                );

                await db.update(
                    'common.segment_sync',
                    {
                        sync_status: 'failed',
                        stats: stats,
                    },
                    { segment_sync_id: segmentSyncId },
                ).run(wpool);

                return err(addResult.error || removeResult.error || ErrCode.EXCEPTION);
            }
        } else {
            let error = ErrCode.EXCEPTION;

            if (!currentMembersResult.isOk()) {
                logger.error(context, tag, `Failed to fetch current segment members. Error: ${currentMembersResult.error}`);
                error = currentMembersResult.error;
            }

            if (!previousMembersResult.isOk()) {
                logger.error(context, tag, `Failed to fetch previous segment members. Error: ${previousMembersResult.error}`);
                error = previousMembersResult.error;
            }

            await db.update(
                'common.segment_sync',
                {
                    sync_status: 'failed',
                    stats: { error: 'Failed to fetch current or previous segment members' },
                },
                { segment_sync_id: segmentSyncId },
            ).run(wpool);

            return err(error);
        }

        return ok(true);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

// Process chunks and track success counts
async function processChunksWithTracking(items, chunkSize, operation, maxConcurrency = 1) {
    let successCount = 0;
    let error = null;
    const queue: any[] = [];

    // Helper function to process a single chunk
    const processChunk = async (chunk) => {
        const result = await operation(chunk);
        if (!result.isOk()) {
            error = result.error;
            throw result.error;
        }
        successCount += chunk.length;
    };

    // Create chunks
    const chunks: any[] = [];

    for (let i = 0; i < items.length; i += chunkSize) {
        chunks.push(items.slice(i, i + chunkSize));
    }

    // Process chunks
    for (const chunk of chunks) {
        // Add the chunk processing to the queue
        const task = processChunk(chunk)
            .catch((err) => {
                error = err;
            })
            .finally(() => {
                // Remove completed task from the queue
                queue.splice(queue.indexOf(task), 1);
            });

        queue.push(task);

        // Wait if we exceed max concurrency
        if (queue.length >= maxConcurrency) {
            await Promise.race(queue);
        }

        // Stop processing on error
        if (error) {
            break;
        }
    }

    // Wait for all remaining tasks to complete
    await Promise.all(queue);

    return { successCount, error };
}

export async function fetchSegmentMemberData(context: IContext, query: string, rule: string, columnName: string, memberIds: number[], filter: boolean = true): Promise<Result<any[], ErrCode>> {
    const tag = [...MTAG, 'fetchSegmentMemberData'];
    const { logger, store: { reader }, redshift, } = context;

    try {
        const segmentQuery = rule.trim() ? `${query} WHERE ${rule}` : query;

        if (segmentQuery.includes('fq_common')) {
            const pool = await redshift();
            const result = await pool.query(segmentQuery);

            if (!filter) {
                return ok(result.rows);
            }
            const memberData = result.rows.filter((row) => memberIds.includes(row[columnName]));

            return ok(memberData);
        } else {
            const pool = await reader();
            const result = await pool.query(segmentQuery);

            if (!filter) {
                return ok(result.rows);
            }
            const memberData = result.rows.filter((row) => memberIds.includes(row[columnName]));

            return ok(memberData);
        }
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

export async function fetchCurrentSegmentMembers(context: IContext, query: string, rule: string, columnName: string): Promise<Result<number[], ErrCode>> {
    const tag = [...MTAG, 'fetchCurrentSegment'];
    const { logger, store: { reader }, redshift, } = context;

    try {
        const segmentQuery = rule.trim() ? `${query} WHERE ${rule}` : query;

        if (segmentQuery.includes('fq_common')) {
            const pool = await redshift();
            const result = await pool.query(segmentQuery);

            const memberIds = result.rows.map((row) => row[columnName]);

            return ok(memberIds);
        } else {
            const pool = await reader();
            const result = await pool.query(segmentQuery);

            const memberIds = result.rows.map((row) => row[columnName]);

            return ok(memberIds);
        }
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

export async function fetchPreviousSegmentMembers(context: IContext, segmentId: number): Promise<Result<number[], ErrCode>> {
    const tag = [...MTAG, 'fetchPreviousSegment'];
    const { logger, store: { reader }, } = context;

    try {
        const pool = await reader();

        const memberRecords = await db.select('common.segment_member', { segment_definition_id: segmentId }).run(pool);

        const memberIds = memberRecords.map((member) => member.member_id).filter((id) => id !== null) as number[];

        return ok(memberIds);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

function getMemberDifferences(previousMembers: number[], currentMembers: number[]): { membersToAdd: number[]; membersToRemove: number[] } {
    const membersToAdd = currentMembers.filter((memberId) => !previousMembers.includes(memberId));
    const membersToRemove = previousMembers.filter((memberId) => !currentMembers.includes(memberId));

    return { membersToAdd, membersToRemove };
}

// methods for segment destinations

export async function createSegmentDestination(context: IContext, destination: string, label: string, description: string, destinationParameters: db.JSONValue): Promise<Result<boolean, ErrCode>> {
    const tag = [...MTAG, 'createSegmentDestination'];
    const { logger, store: { writer }, } = context;

    try {
        const insertable: zs.common.segment_destination_definition.Insertable = {
            destination,
            label,
            description,
            destination_parameters: destinationParameters,
        };

        const pool = await writer();
        await db.insert('common.segment_destination_definition', insertable).run(pool);

        return ok(true);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

export async function deleteSegmentDestination(context: IContext, segmentDestinationId: number): Promise<Result<boolean, ErrCode>> {
    const tag = [...MTAG, 'deleteSegmentDestination'];
    const { logger, store: { writer }, } = context;

    try {
        const pool = await writer();
        await db.deletes('common.segment_destination_definition', {
            segment_destination_definition_id: segmentDestinationId,
        }).run(pool);

        return ok(true);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

export async function fetchSegmentDestinations(context: IContext, segmentProfileId: number): Promise<Result<string[], ErrCode>> {
    const tag = [...MTAG, 'fetchSegmentDestinations'];
    const { logger, store: { reader }, } = context;

    try {
        const pool = await reader();

        // get destinations by looking up all the destination ids from the segment_destination_mapping table
        const destinationRecords = await db.sql<zs.common.segment_destination_definition.SQL>`
            SELECT DISTINCT destination
            FROM common.segment_destination_definition
            JOIN common.segment_destination_mapping USING (segment_destination_definition_id)
            WHERE segment_definition_id = ${db.param(segmentProfileId)}
        `.run(pool);

        const destinations = destinationRecords.map((destination) => destination.label);
        const uniqueDestinations = Array.from(new Set(destinations));

        return ok(uniqueDestinations);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

export interface DestinationDefinition {
    destination: string;
    destinationParameters: any;
};

export async function fetchSegmentDestinationDefinition(context: IContext, segmentDestinationId: number): Promise<Result<DestinationDefinition, ErrCode>> {
    const tag = [...MTAG, 'fetchSegmentDestinationDefinition'];
    const { logger, store: { reader }, } = context;

    try {
        const pool = await reader();
        const destinationRecord = await db.selectExactlyOne('common.segment_destination_definition', {
            segment_destination_definition_id: segmentDestinationId,
        }).run(pool);

        const destination = destinationRecord.destination;
        const destinationParameters = destinationRecord.destination_parameters;

        return ok({ destination, destinationParameters });
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

export async function createSegmentDestinationMapping(context: IContext, segmentId: number, segmentDestinationId: number, destinationConfig?: any): Promise<Result<boolean, ErrCode>> {
    const tag = [...MTAG, 'createSegmentDestinationMapping'];
    const { logger, store: { reader, writer }, } = context;

    try {
        const pool = await reader();

        const segmentDestinationRecord = await db.selectExactlyOne(
            'common.segment_destination_definition',
            {
                segment_destination_definition_id: segmentDestinationId,
            }).run(pool);

        const insertable: zs.common.segment_destination_mapping.Insertable = {
            segment_definition_id: segmentId,
            segment_destination_definition_id: segmentDestinationRecord.segment_destination_definition_id,
            destination_config: destinationConfig || {},
        };

        const segmentDestinationMappingRecord = await db.selectExactlyOne(
            'common.segment_destination_mapping', {
            segment_destination_definition_id: segmentDestinationId,
            segment_definition_id: segmentId,
        }).run(pool);

        if (segmentDestinationMappingRecord.segment_definition_id !== null) {
            return ok(true);
        } else {
            const wpool = await writer();
            await db.insert('common.segment_destination_mapping', insertable).run(wpool);

            return ok(true);
        }
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

export async function deleteSegmentDestinationMapping(context: IContext, segmentId: number, segmentDestinationId: number): Promise<Result<boolean, ErrCode>> {
    const tag = [...MTAG, 'deleteSegmentDestinationMapping'];
    const { logger, store: { writer }, } = context;

    try {
        const pool = await writer();

        await db.deletes('common.segment_destination_mapping', {
            segment_definition_id: segmentId,
            segment_destination_definition_id: segmentDestinationId,
        }).run(pool);

        return ok(true);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

export async function fetchSegmentDestinationMappings(context: IContext, segmentId: number): Promise<Result<zs.common.segment_destination_mapping.JSONSelectable[], ErrCode>> {
    const tag = [...MTAG, 'fetchSegmentDestinationMappings'];
    const { logger, store: { reader }, } = context;

    try {
        const pool = await reader();
        const destinationRecords = await db.select('common.segment_destination_mapping', { segment_definition_id: segmentId }).run(pool);

        return ok(destinationRecords);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

async function fetchLatestSegmentSyncId(context: IContext, segmentId: number): Promise<Result<number, ErrCode>> {
    const tag = [...MTAG, 'fetchLatestSegmentSyncId'];
    const { logger, store: { reader }, } = context;

    try {
        const pool = await reader();
        const result = await pool.query(
            `SELECT MAX(segment_sync_id) as segment_sync_id FROM common.segment_sync WHERE segment_definition_id = ${segmentId}::int`,
        );

        const latestSegmentSyncId = result.rows[0]['segment_sync_id'];

        return ok(latestSegmentSyncId);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

export async function fetchSegmentMembers(context: IContext, segmentId: number): Promise<Result<[number[], number[]], ErrCode>> {
    const tag = [...MTAG, 'fetchSegmentMembers'];
    const { logger, store: { reader }, } = context;

    try {
        const pool = await reader();
        const latestSegmentSyncIdResult = await fetchLatestSegmentSyncId(context, segmentId);

        if (!latestSegmentSyncIdResult.isOk()) {
            logger.error(context, tag, `Failed to fetch latest segment sync ID. Error: ${latestSegmentSyncIdResult.error}`);
            return err(latestSegmentSyncIdResult.error);
        }

        const segmentMembersToAdd = await db.select('common.segment_member_history', {
            segment_definition_id: segmentId,
            segment_sync_id: latestSegmentSyncIdResult.value,
            operation: 'add',
        }).run(pool);

        const segmentMembersToRemove = await db.select('common.segment_member_history', {
            segment_definition_id: segmentId,
            segment_sync_id: latestSegmentSyncIdResult.value,
            operation: 'remove',
        }).run(pool);

        const memberIdsToAdd = segmentMembersToAdd
            .map((member) => member.member_id)
            .filter((id) => id !== null) as number[];

        const memberIdsToRemove = segmentMembersToRemove
            .map((member) => member.member_id)
            .filter((id) => id !== null) as number[];

        return ok([memberIdsToAdd, memberIdsToRemove]);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

async function segmentDestinationSyncStatus(context: IContext, segmentDestinationMappingId: number, status: string): Promise<Result<boolean, ErrCode>> {
    const tag = [...MTAG, 'segmentDestinationSyncStatus'];
    const { logger, store: { writer }, } = context;

    try {
        if (status == 'pending') {
            const insertable: zs.common.segment_destination_sync.Insertable = {
                segment_destination_mapping_id: segmentDestinationMappingId,
                stats: {},
                sync_status: status,
            };

            const pool = await writer();

            await db.insert('common.segment_destination_sync', insertable).run(pool);
        } else {
            const pool = await writer();
            await db.update(
                'common.segment_destination_sync',
                { sync_status: status },
                { segment_destination_mapping_id: segmentDestinationMappingId },
            ).run(pool);
        }

        return ok(true);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

export async function syncSegmentDestination(context: IContext, segmentId: number): Promise<Result<boolean, ErrCode>> {
    const tag = [...MTAG, 'syncSegmentDestination'];
    const { logger } = context;

    try {
        logger.info(context, tag, `Performing sync segment destination actions for segment ${segmentId}`);

        const destinationMappingIdsResult = await fetchSegmentDestinationMappings(context, segmentId);

        if (!destinationMappingIdsResult.isOk()) {
            logger.error(
                context,
                tag,
                `Failed to fetch destination mapping IDs. Error: ${destinationMappingIdsResult.error}`,
            );
            return err(destinationMappingIdsResult.error);
        }

        const destinationMappings = destinationMappingIdsResult.value;

        if (destinationMappings.length === 0) {
            logger.info(context, tag, `No destination mappings found for segment ${segmentId}`);

            return ok(false);
        }

        for (const {
            segment_destination_mapping_id: segmentDestinationMappingId,
            segment_destination_definition_id: segmentDestinationDefinitionId,
            destination_config,
        } of destinationMappings) {
            try {
                const destinationDefinitionResult = await fetchSegmentDestinationDefinition(context, segmentDestinationDefinitionId);

                if (!destinationDefinitionResult.isOk()) {
                    const fetchDestinationParametersError =
                        `Failed to fetch destination parameters for mapping ID ${segmentDestinationDefinitionId}.`;

                    logger.error(context, tag, fetchDestinationParametersError, destinationDefinitionResult);

                    continue;
                }

                const destinationDefinition = destinationDefinitionResult.value;

                if (destinationDefinition) {
                    await segmentDestinationSyncStatus(context, segmentDestinationMappingId, 'pending');

                    const destinationConfig = destination_config as Integration.DestinationConfig;

                    const result = await Integration.checkAndExecuteOperation(context, { segmentId, destinationDefinition, destinationConfig });

                    if (result.isOk()) {
                        await segmentDestinationSyncStatus(context, segmentDestinationMappingId, 'completed');
                    } else {
                        await segmentDestinationSyncStatus(context, segmentDestinationMappingId, 'failed');
                    }
                }
            } catch (error) {
                logger.error(context, tag, `Error processing segmentDestinationMappingId: ${segmentDestinationMappingId}`, error);
            }
        }

        return ok(true);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}
