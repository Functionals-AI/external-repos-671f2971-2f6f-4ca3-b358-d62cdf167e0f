import React from 'react';
import { Trans } from 'react-i18next';

import StickyNoteItem from './sticky-note-item';
import Icon from '@/ui-components/icons/Icon';
import Modal from '@/modules/modal/ui/modal';
import { FormV2, useForm } from '@/modules/form/form';
import Section from '@/ui-components/section';
import { useSpecificModalContext } from '@/modules/modal/context';
import { useGetStickyNotesForPatients } from '../../../../../../../api/provider/useGetStickyNotesForPatient';
import ContainerLoading from '@/ui-components/loading/container-loading';
import GetErrorDisplay from '@/modules/errors/get-error-display';
import { DeveloperError } from 'utils/errors';

export default function StickyNoteList({ onCreateNew, patientId }: { onCreateNew: () => void, patientId: number }) {
  const form = useForm();
  const specificModal = useSpecificModalContext();

  const { data, isLoading, error, refetch } = useGetStickyNotesForPatients(patientId);

  if (isLoading) {
    return <ContainerLoading />;
  }
  if (error) {
    return <GetErrorDisplay refetch={refetch} error={error} />;
  }

  const items = data?.stickyNotes.map(note => (
    <StickyNoteItem
      key={note.stickyNoteId}
      content={note.noteContent}
      author={note.provider?.name}
      createdAt={note.createdAt}
    />
  ))

  if (data?.stickyNotes.length === 0) {
    throw new DeveloperError('Sticky Notes shouldn\'t be empty');
  }

  return (
    <FormV2 form={form} onSubmit={() => {}}>
      <Modal.Header title={<Trans>Notes</Trans>} />
      <Modal.Body>
        <Section>
          {items}
        </Section>
      </Modal.Body>
      <Modal.Footer className="justify-end">
        <Modal.Footer.ButtonGroup>
          <Modal.Footer.SecondaryCloseButton onClick={() => onCreateNew?.()}>
            <Icon size="sm" name="sticky-note-plus" color="neutral" />
            <Trans>Create new note</Trans>
          </Modal.Footer.SecondaryCloseButton>
          <Modal.Footer.PrimaryButton
            onClick={() => {
              specificModal.closeModal();
            }}
            dataTestId="confirm-cancel"
          >
            <Trans>Close</Trans>
          </Modal.Footer.PrimaryButton>
        </Modal.Footer.ButtonGroup>
      </Modal.Footer>
    </FormV2>
  );
}
