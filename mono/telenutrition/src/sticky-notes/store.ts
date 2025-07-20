import * as db from 'zapatos/db'
import * as zs from 'zapatos/schema'

import '@mono/common/lib/zapatos/schema'

import {IContext} from "@mono/common/lib/context"
import {Logger} from '@mono/common'
import {ErrCode} from "@mono/common/lib/error"
import {err, ok, Result} from "neverthrow"

import {InsertStickyNoteRecord, StickyNoteRecord} from "./types";

const MTAG = Logger.tag()

export async function insertStickyNote(context: IContext, record: InsertStickyNoteRecord): Promise<Result<StickyNoteRecord, ErrCode>> {
    const {logger, store: {writer}} = context

    const TAG = [...MTAG, 'insertStickyNote']

    try {
        const pool = await writer();

        const insertable: zs.telenutrition.sticky_note.Insertable = {
            parent_note_id: record.parentNoteId,
            patient_id: record.patientId,
            provider_id: record.providerId,
            source_type: record.sourceType,
            source_id: record.sourceId,
            note_content: record.noteContent,
            is_active: record.isActive,
            status: record.status
        };
        const result = await db
            .insert("telenutrition.sticky_note", insertable)
            .run(pool);

        return ok(mapStickyNoteRecord(result))
    } catch (e) {
        logger.exception(context, TAG, e)
        return err(ErrCode.EXCEPTION)
    }
}

export async function getAllActiveStickyNotesForPatient(context: IContext, patientId: number): Promise<Result<StickyNoteRecord[], ErrCode>> {
    const {store: {reader}, logger} = context

    const TAG = [...MTAG, 'getAllActiveStickyNotesForPatient']

    try {
        const pool = await reader()

        const result = await db.select(
            'telenutrition.sticky_note', {
                is_active: true,
                patient_id: patientId
            },
            {
                order: {
                    by: 'updated_at',
                    direction: 'DESC'
                },
                lateral: {
                    provider: db.selectExactlyOne('telenutrition.schedule_provider', {
                        provider_id: db.parent('provider_id')
                    }, {
                        columns: ['first_name', 'last_name']
                    })
                }
            }
        ).run(pool);

        const notes = result.map(r => mapStickyNoteRecord(r))

        return ok(notes)
    } catch (e) {
        logger.exception(context, TAG, e)
        return err(ErrCode.EXCEPTION)
    }
}

function mapStickyNoteRecord(record: StickyNoteWithAuthorName): StickyNoteRecord {
    return {
        stickyNoteId: record.sticky_note_id,
        parentNoteId: record.parent_note_id ?? undefined,
        patientId: record.patient_id,
        providerId: record.provider_id,
        provider: record.provider ? {
            name: `${record.provider.first_name} ${record.provider.last_name} RD`,
        } : undefined,
        sourceType: record.source_type ?? undefined,
        sourceId: record.source_id ?? undefined,
        noteContent: record.note_content,
        status: record.status,
        isActive: record.is_active,
        createdAt: record.created_at,
        updatedAt: record.updated_at
    }
}

export type StickyNoteWithAuthorName = (zs.telenutrition.sticky_note.JSONSelectable & db.LateralResult<{
    provider?: db.SQLFragment<db.JSONOnlyColsForTable<"telenutrition.schedule_provider", ("first_name" | "last_name")[]>, never>
}>)


export default {
    insertStickyNote,
    getAllActiveStickyNotesForPatient
}
