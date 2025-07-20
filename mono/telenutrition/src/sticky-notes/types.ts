import { ProviderRecord } from "../scheduling/provider/shared";

export interface StickyNoteRecord {
    stickyNoteId: number;
    parentNoteId?: number;
    patientId: number;
    providerId: number;
    sourceType?: string;
    sourceId?: number;
    noteContent: string;
    status: string;
    isActive: boolean;
    provider?: Pick<ProviderRecord, 'name'>
    createdAt: string,
    updatedAt: string,
    archivedAt?: string
}

export type InsertStickyNoteRecord = Omit<
    StickyNoteRecord,
    'stickyNoteId' | 'status' | 'isActive' | 'createdAt' | 'updatedAt' | 'archivedAt'
> & {
    status?: string
    isActive?: boolean
};
