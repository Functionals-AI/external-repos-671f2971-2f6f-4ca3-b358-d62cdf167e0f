import Api from '../../integration/customerio/api';
import Service from '../../integration/customerio/service';
import { err, ok, Result } from 'neverthrow';
import { ErrCode } from '../../error';
import { IContext } from '../../context';
import * as _ from 'lodash';
import * as db from 'zapatos/db';
import * as SegmentService from '../service';
import { IntegrationConfig } from '../integration';

const MTAG = ['common', 'segmentation', 'destination', 'cio'];

async function createIdentifiers(context: IContext, memberIds: number[]): Promise<Result<string[], ErrCode>> {
    const tag = [...MTAG, 'createIdentifiers'];
    const { logger } = context;

    try {
        const results = await Promise.all(
            memberIds.map(async (memberId) => {
                const result = Service.createCustomerIdentifer(context, { identityId: memberId });

                if (result.isErr()) {
                    logger.error(context, tag, 'failed to create identifier for member', { memberId });
                    return err(ErrCode.STATE_VIOLATION);
                }

                return ok(result.value);
            }),
        );

        const identifiers = results.map((result) => {
            return result.isErr() ? null : result.value;
        }).filter((identifier) => identifier !== null) as string[];

        return ok(identifiers);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

export async function syncDataToCio(context: IContext, config: IntegrationConfig): Promise<Result<boolean, ErrCode>> {
    const tag = [...MTAG, 'syncDataToCio'];
    const { logger, store: { reader } } = context;
    
    logger.info(context, tag, `Syncing segment ${config.segmentId} data to CIO`);
    
    try {
        const pool = await reader();
        const segmentRecord = await db.selectExactlyOne('common.segment_definition', { segment_definition_id: config.segmentId }).run(pool);

        let segmentName = config.destinationConfig?.destinationSegmentName || segmentRecord.label;
        let segmentDescription = config.destinationConfig?.destinationSegmentDescription || segmentRecord.description;

        if (/[^a-z0-9_\-]/i.test(segmentName)) {
            logger.error(context, tag, 'Failed to use segment label, invalid segment name', { name: segmentName });
            return err(ErrCode.INVALID_DATA);
        }

        // fetch segments from CIO
        const existingSegments = await Api.getSegment(context);
        if (existingSegments.isErr()) {
            logger.error(context, tag, 'Failed to get segment from CIO', { segmentRecord });
            return err(existingSegments.error);
        }

        const segments = existingSegments.value;

        function segmentMatcher(segment: any) {
            return segment.name === segmentName;
        }

        const matchingSegment = segments.find(segmentMatcher);

        const chosenSegmentMessage = matchingSegment?.id ? `CIO segment ${matchingSegment?.id} chosen` : 'creating new CIO segment';

        const foundSegmentMessage =
            `Found ${segments.filter(segmentMatcher).length} segment(s) with name ${segmentName} out of ${segments.length}, ${chosenSegmentMessage}`;

        logger.info(context, tag, foundSegmentMessage, { matchingSegment });

        let cioSegmentId = matchingSegment?.id;

        if (!cioSegmentId) {
            const resultCreate = await Api.createSegment(context, {
                name: segmentName,
                description: segmentDescription || '',
            });

            if (resultCreate.isErr()) {
                logger.error(context, tag, 'Failed to create segment in CIO', { segmentRecord });
                return err(resultCreate.error);
            }

            logger.info(context, tag, `Created segment ${resultCreate.value.id} in CIO`, { segmentRecord, resultCreate });

            cioSegmentId = resultCreate.value.id;
        }

        const memberIdsResult = await SegmentService.fetchSegmentMembers(context, segmentRecord.segment_definition_id);

        if (!memberIdsResult.isOk()) {
            const fetchMembersError = `Failed to fetch segment members for segment ID ${segmentRecord.segment_definition_id}. Error: ${memberIdsResult.error}`;
            logger.error(context, tag, fetchMembersError);

            return ok(true);
        }

        const [memberIdsToAdd, memberIdsToRemove] = memberIdsResult.value;

        const addRemoveMessage = `Adding ${memberIdsToAdd.length} member(s) to and removing ${memberIdsToRemove.length} member(s) from CIO segment ${cioSegmentId}`;
        logger.info(context, tag, addRemoveMessage, { segmentRecord });

        const identifiersToAdd = await createIdentifiers(context, memberIdsToAdd);

        if (identifiersToAdd.isErr()) {
            logger.error(context, tag, 'Failed to create identifiers for add segment members', { segmentRecord });
            return err(identifiersToAdd.error);
        }

        const idsToAdd = identifiersToAdd.value;
        const addResult = await Api.addSegmentMembers(context, cioSegmentId, idsToAdd);

        if (addResult.isErr()) {
            logger.error(context, tag, 'Failed to add segment members', { segmentRecord });
            return err(addResult.error);
        }

        const identifersToRemove = await createIdentifiers(context, memberIdsToRemove);

        if (identifersToRemove.isErr()) {
            logger.error(context, tag, 'Failed to create identifiers for remove segment members', { segmentRecord });
            return err(identifersToRemove.error);
        }

        const idsToRemove = identifersToRemove.value;
        const removeResult = await Api.removeSegmentMembers(context, cioSegmentId, idsToRemove);

        if (removeResult.isErr()) {
            logger.error(context, tag, 'Failed to remove segment members', { segmentRecord });
            return err(removeResult.error);
        }

        return ok(true);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}
