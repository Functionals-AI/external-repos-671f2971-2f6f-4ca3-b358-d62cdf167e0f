import usePost from '../usePost';
import { getFetchStickyNotesForPatientQueryKey, StickyNote } from './useGetStickyNotesForPatient';

export type PostStickyNotesParams = {
  patientId: number;
  noteContent: string;
  sourceType?: string;
  sourceId?: number;
  status?: string;
  isActive?: boolean;
};

export type UsePostStickyNotesParams = {
  payload: {
    stickyNote: PostStickyNotesParams;
  };
};

export type UsePostStickyNoteReturn = {
  stickyNote: StickyNote
};

export default function usePostStickyNotes(patientId: number) {
  return usePost<UsePostStickyNotesParams, UsePostStickyNoteReturn>({
    path: '/provider/sticky-notes',
    invalidateCacheKeys: [getFetchStickyNotesForPatientQueryKey(patientId)],
  });
}
