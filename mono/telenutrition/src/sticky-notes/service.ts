import {Result, err, ok} from "neverthrow"

import {IContext} from '@mono/common/lib/context'
import {ErrCode} from "@mono/common/lib/error"

import StickyNote from './index'
import {InsertStickyNoteRecord, StickyNoteRecord} from "./types";

const MTAG = ['telenutrition', 'stickyNotes', 'service']

async function createStickyNote(
    context: IContext,
    stickyNote: InsertStickyNoteRecord
): Promise<Result<StickyNoteRecord, ErrCode>> {
    const {logger} = context;
    const TAG = [...MTAG, 'createStickyNote']

    try {

        const stickyNoteProps = {
            ...stickyNote,
            isActive: stickyNote.isActive ?? true,
            status: stickyNote.status ?? 'active'
        }

        const insertedStickyNoteResult = await StickyNote.Store.insertStickyNote(context, stickyNoteProps);

        if (insertedStickyNoteResult.isErr()) {
            logger.error(context, TAG, 'Error inserting sticky note')
            return err(insertedStickyNoteResult.error);
        }

        return ok(insertedStickyNoteResult.value)
    } catch (e) {
        logger.exception(context, TAG, e)
        return err(ErrCode.EXCEPTION)
    }
}


async function getPatientStickyNotes(
    context: IContext, patientId: number
): Promise<Result<StickyNoteRecord[], ErrCode>> {
    const {logger} = context;
    const TAG = [...MTAG, 'getPatientStickyNotes']
    try {
        const result = await StickyNote.Store.getAllActiveStickyNotesForPatient(context, patientId)

        if (result.isErr()) {
            logger.error(context, TAG, 'Error querying sticky notes for patient', {patientId})
            return err(result.error);
        }

        return ok(result.value);
    } catch (e) {
        logger.exception(context, TAG, e)
        return err(ErrCode.EXCEPTION)
    }

}

export default {
    createStickyNote,
    getPatientStickyNotes
}
