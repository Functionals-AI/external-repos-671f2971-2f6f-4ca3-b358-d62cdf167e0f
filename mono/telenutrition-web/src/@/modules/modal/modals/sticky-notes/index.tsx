import React from 'react';

import Wizard from 'components/wizard';
import WizardSteps from 'components/wizard/wizard-steps';
import Modal from '@/modules/modal/ui/modal';

import { StickyNotesModalData } from '../../types';
import NewStickyNote from './flows/new-sticky-note';
import StickyNoteList from './flows/sticky-note-list';

export default function StickyNotesModal({
  initialStep,
  patientId,
  sourceType,
  sourceId,
}: StickyNotesModalData) {
  return (
    <Modal size="lg">
      <Wizard
        flowName="sticky_notes"
        start={initialStep ?? 'list'}
        initialState={{}}
        steps={{
          create: {
            render: () => (
              <NewStickyNote patientId={patientId} sourceType={sourceType} sourceId={sourceId} />
            ),
          },
          list: {
            render: ({ goTo }) => (
              <StickyNoteList onCreateNew={() => goTo('create')} patientId={patientId} />
            ),
          },
        }}
      >
        <WizardSteps />
      </Wizard>
    </Modal>
  );
}
