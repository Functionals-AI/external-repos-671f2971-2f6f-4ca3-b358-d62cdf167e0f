import React, { useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import Modal from '@/modules/modal/ui/modal';
import { FormV2, useForm } from '@/modules/form/form';
import Section from '@/ui-components/section';
import { useSpecificModalContext } from '@/modules/modal/context';
import { useModal } from '@/modules/modal';
import useToaster from 'hooks/useToaster';

import usePostStickyNotes from 'api/provider/usePostStickyNotes';

interface NewStickyNoteProps {
  patientId: number;
  sourceType?: string;
  sourceId?: number;
}

type NewStickyNoteFormValues = {
  noteContent: string;
};

export default function NewStickyNote({ patientId, sourceType, sourceId }: NewStickyNoteProps) {
  const { t } = useTranslation();
  const { post } = usePostStickyNotes(patientId);
  const modal = useModal();

  const form = useForm<NewStickyNoteFormValues>();
  const specificModal = useSpecificModalContext();

  const toaster = useToaster();

  const onSubmit = useCallback(
    async (formData: NewStickyNoteFormValues) => {
      try {
        await post({
          payload: {
            stickyNote: {
              patientId,
              noteContent: formData.noteContent,
              isActive: true,
              status: 'active',
              sourceType,
              sourceId,
            },
          },
        });

        toaster.success({
          message: t('Sticky note created'),
        });
        modal.closeAll();
      } catch (error) {
        toaster.apiError({ error, title: t('Failed to create sticky note') });
      }
    },
    [modal, patientId, post, sourceId, sourceType, toaster],
  );

  return (
    <FormV2 form={form} onSubmit={onSubmit}>
      <Modal.Header title={<Trans>New sticky note</Trans>} />
      <Modal.Body>
        <Section
          title="Sticky Note"
          subtitle="A sticky note is an internal note that is never shared with members."
        >
          <FormV2.FormTextArea
            form={form}
            id="noteContent"
            showCharacterCount={true}
            maxCount={300}
            rules={{ required: true }}
          />
          <p className="text-neutral-600 text-sm">
            <Trans>
              Please do not add clinical or billing information. This section is for member-related
              notes only and should not contain any sensitive health or financial details. Be aware
              that members may request access to these notes.
            </Trans>
          </p>
        </Section>
      </Modal.Body>
      <Modal.Footer className="justify-end">
        <Modal.Footer.ButtonGroup>
          <Modal.Footer.SecondaryCloseButton
            onClick={() => {
              specificModal.closeModal();
            }}
          >
            <Trans>Cancel</Trans>
          </Modal.Footer.SecondaryCloseButton>
          <Modal.Footer.PrimaryButton disabled={!form.formState.isValid}>
            <Trans>Save Note</Trans>
          </Modal.Footer.PrimaryButton>
        </Modal.Footer.ButtonGroup>
      </Modal.Footer>
    </FormV2>
  );
}
