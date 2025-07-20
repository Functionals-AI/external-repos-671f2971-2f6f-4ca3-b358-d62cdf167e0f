import useFetch, { UseFetchTypes } from 'hooks/useFetch';
import type { ProviderRecord } from '@mono/telenutrition/lib/types';

export interface StickyNote {
  stickyNoteId: number;
  parentNoteId?: number;
  patientId: number;
  providerId: number;
  sourceType?: string;
  sourceId?: number;
  noteContent: string;
  status: string;
  isActive: boolean;
  provider?: Pick<ProviderRecord, 'name'>;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export type UseGetStickyNotesForPatientsParams = {
  patientId: number;
};

export type UseGetStickyNotesForPatientsResult = {
  stickyNotes: StickyNote[];
};

export const getFetchStickyNotesForPatientQueryKey = (patientId: number | string) => [
  'provider',
  'stickyNotes',
  patientId,
];

export function useGetStickyNotesForPatients(patientId: number) {
  return useFetch<
    UseFetchTypes<UseGetStickyNotesForPatientsParams, UseGetStickyNotesForPatientsResult>
  >({
    path: '/provider/sticky-notes',
    queryKey: getFetchStickyNotesForPatientQueryKey(patientId),
    options: {
      params: { patientId },
    },
  });
}
