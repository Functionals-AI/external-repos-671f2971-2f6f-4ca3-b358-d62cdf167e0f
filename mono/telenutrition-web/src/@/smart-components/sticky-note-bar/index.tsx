import React from 'react';

import { Trans, useTranslation } from 'react-i18next';

import { useModal } from '@/modules/modal';
import Icon from '@/ui-components/icons/Icon';
import { useGetStickyNotesForPatients } from '../../../api/provider/useGetStickyNotesForPatient';
import { Button } from '@/ui-components/button';
import { cn } from '@/utils';

interface StickyNoteBarProps {
  patientId: number;
  sourceType?: string;
  sourceId?: number;
  className?: string;
}

export default function StickyNoteBar({
  patientId,
  sourceType,
  sourceId,
  className,
}: StickyNoteBarProps) {
  const modal = useModal();
  const { t } = useTranslation();

  const { data, isLoading, error } = useGetStickyNotesForPatients(patientId);

  const content = (() => {
    if (isLoading) return <div className="ml-6">...</div>;
    if (error)
      return (
        <div className="text-base text-neutral-600">
          <Trans>Unable to fetch sticky notes for this patient</Trans>
        </div>
      );

    const stickNoteSection =
      data?.stickyNotes?.length > 0 ? (
        <div className="flex flex-row">
          <Icon className='mt-[2px]' size="md" name="sticky-note-filled" color="neutral" />
          <div className="ml-1">
            <div className="text-base text-neutral-600 ml-1">
              {t('{{count}} open sticky notes', { count: data.stickyNotes.length })}
            </div>
            <Button
              variant="tertiary"
              size="sm"
              className="text-sm 600 text-f-dark-green select-none"
              onClick={() =>
                modal.openPrimary({
                  type: 'sticky-notes',
                  initialStep: 'list',
                  patientId,
                  sourceType,
                  sourceId,
                })
              }
            >
              <Trans>View sticky notes</Trans>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-row">
          <Icon size="md" name="sticky-note" color="neutral" />
          <div className="text-base text-neutral-600 ml-2">
            <Trans>No notes</Trans>
          </div>
        </div>
      );

    return (
      <>
        {stickNoteSection}
        <Button
          variant="tertiary"
          size="sm"
          onClick={() =>
            modal.openPrimary({
              type: 'sticky-notes',
              initialStep: 'create',
              patientId,
              sourceType,
              sourceId,
            })
          }
        >
          <Icon size="sm" name="sticky-note-plus" color="darkGreen" />
          <Trans>New sticky note</Trans>
        </Button>
      </>
    );
  })();

  return (
    <div
      className={cn(
        'bg-neutral-100 flex justify-between items-center p-2 h-[4.5rem] rounded-md',
        className,
      )}
    >
      {content}
    </div>
  );
}
