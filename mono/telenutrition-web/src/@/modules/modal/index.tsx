'use client';

import React, { ReactNode, useContext, useState } from 'react';
import { DeveloperError } from 'utils/errors';
import BasicModal from './modals/basic';
import DialogModal from './modals/dialog';
import RescheduleSessionModal from './modals/reschedule-session';
import CancelSessionModal from './modals/cancel-session';
import FreezeSlotModal from './modals/freeze-slot';

import {
  ModalData,
  ModalState,
  SelectedModalState,
  isModalMatchToType,
  isModalSelected,
} from './types';
import ScheduleSessionModal from './modals/schedule-session';
import Backdrop from './ui/backdrop';
import { SpecificModalContext } from './context';
import BasicDialogModal from './modals/basic-dialog';
import UnfreezeSlotModal from './modals/unfreeze-slot';
import AddhouseholdMemberModal from './modals/add-household-member';
import ResolveConflictsModal from './modals/resolve-conflicts';
import AddTaskModal from './modals/add-task';
import StickyNotesModal from './modals/sticky-notes';
import AfterVisitSummaryModal from './modals/after-visit-summary';
import PromptProviderLoginModal from './modals/prompt-provider-login-modal';
import ScheduleSessionV2Modal from '../../features/patient-scheduler/modals/schedule-session-v2-modal';
import ScheduleVisitSelfModal from '../../features/patient-scheduler/modals/schedule-visit-self-modal';
import ScheduleSlotOptionsModal from '../../features/patient-scheduler/modals/schedule-slot-options-modal';
import RescheduleSessionV2Modal from '@/features/patient-scheduler/modals/reschedule-session-v2-modal';
import ScheduleWithOtherKnownModal from '../../features/patient-scheduler/modals/schedule-with-other-known-modal';
import ScheduleWithOtherUnknownProviderModal from '../../features/patient-scheduler/modals/schedule-with-other-unknown-provider-modal/schedule';
import RescheduleVisitSelfModal from '../../features/patient-scheduler/modals/reschedule-visit-self-modal';
import RescheduleWithOtherKnownModal from '../../features/patient-scheduler/modals/reschedule-with-other-known-modal';
import RescheduleWithOtherUnknownProviderModal from '../../features/patient-scheduler/modals/schedule-with-other-unknown-provider-modal/reschedule';
import VisitDetailsModal from './modals/coverage-details';
import CoverageDetailsModal from './modals/coverage-details';
import OverbookingConfirmationModal from '../../features/patient-scheduler/modals/overbooking-confirmation-modal';

const ModalContext = React.createContext<ModalState | null>(null);

function ModalProvider({ children }: { children: ReactNode }) {
  const [modals, setModals] = useState<{ primary: ModalData; secondary?: ModalData } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  function openPrimary(m: ModalData) {
    setIsVisible(true);
    setModals({ primary: m });
  }

  function openSecondary(secondary: ModalData) {
    setModals((m) => ({ primary: m?.primary!, secondary }));
  }

  function closeAll(type?: 'success' | 'error') {
    setIsVisible(false);
    // Optional custom close method
    if (type === 'success') {
      modals?.primary?.onSuccess?.();
    }
    setTimeout(() => {
      setModals(null);
    }, 300);
  }

  function closeSecondary() {
    setModals((m) => ({ primary: m?.primary!, secondary: undefined }));
  }

  return (
    <ModalContext.Provider
      value={{ closeAll, openPrimary, modals, isVisible, openSecondary, closeSecondary }}
    >
      {children}
    </ModalContext.Provider>
  );
}

function RenderModal({ modal }: { modal: ModalData }) {
  if (modal.type === 'basic') {
    return <BasicModal {...modal} />;
  }

  if (modal.type === 'dialog') {
    return <DialogModal {...modal} />;
  }

  if (modal.type === 'reschedule-session') {
    return <RescheduleSessionModal {...modal} />;
  }

  if (modal.type === 'cancel-session') {
    return <CancelSessionModal {...modal} />;
  }

  if (modal.type === 'freeze-slot') {
    return <FreezeSlotModal {...modal} />;
  }

  if (modal.type === 'schedule-session') {
    return <ScheduleSessionModal {...modal} />;
  }

  if (modal.type === 'schedule-session-v2') {
    return <ScheduleSessionV2Modal {...modal} />;
  }

  if (modal.type === 'reschedule-session-v2') {
    return <RescheduleSessionV2Modal {...modal} />;
  }

  if (modal.type === 'schedule-visit-self') {
    return <ScheduleVisitSelfModal {...modal} />;
  }

  if (modal.type === 'schedule-with-other-known') {
    return <ScheduleWithOtherKnownModal {...modal} />;
  }

  if (modal.type === 'schedule-with-other-unknown') {
    return <ScheduleWithOtherUnknownProviderModal {...modal} />;
  }

  if (modal.type === 'reschedule-visit-self') {
    return <RescheduleVisitSelfModal {...modal} />;
  }

  if (modal.type === 'reschedule-with-other-known') {
    return <RescheduleWithOtherKnownModal {...modal} />;
  }

  if (modal.type === 'reschedule-with-other-unknown') {
    return <RescheduleWithOtherUnknownProviderModal {...modal} />;
  }

  if (modal.type === 'schedule-slot-options') {
    return <ScheduleSlotOptionsModal {...modal} />;
  }

  if (modal.type === 'add-household-member') {
    return <AddhouseholdMemberModal {...modal} />;
  }

  if (modal.type === 'custom') {
    return <>{modal.modal}</>;
  }

  if (modal.type === 'basic-dialog') {
    return <BasicDialogModal modal={modal} />;
  }

  if (modal.type === 'unfreeze-slot') {
    return <UnfreezeSlotModal {...modal} />;
  }

  if (modal.type === 'resolve-conflicts') {
    return <ResolveConflictsModal {...modal} />;
  }

  if (modal.type === 'add-task') {
    return <AddTaskModal />;
  }

  if (modal.type === 'sticky-notes') {
    return <StickyNotesModal {...modal} />;
  }

  if (modal.type === 'after-visit-summary') {
    return <AfterVisitSummaryModal {...modal} />;
  }

  if (modal.type === 'prompt-provider-login') {
    return <PromptProviderLoginModal />;
  }

  if (modal.type === 'coverage-details') {
    return <CoverageDetailsModal {...modal} />;
  }
  
  if (modal.type === 'overbooking-confirmation') {
    return <OverbookingConfirmationModal {...modal} />
  }

  return null;
}

function ModalManager() {
  const modalState = useModal();

  if (!modalState.modals) return null;

  return (
    <Backdrop isOpen={modalState.isVisible}>
      <SpecificModalContext.Provider
        value={{
          type: 'primary',
          showCloseButton: modalState.modals.primary.showCloseButton,
          isDormant: !!modalState.modals.secondary,
        }}
      >
        <RenderModal modal={modalState.modals.primary} />
      </SpecificModalContext.Provider>
      {modalState.modals.secondary && (
        <SpecificModalContext.Provider
          value={{
            type: 'secondary',
            showCloseButton: modalState.modals.secondary.showCloseButton,
            isDormant: false,
          }}
        >
          <RenderModal modal={modalState.modals.secondary} />
        </SpecificModalContext.Provider>
      )}
    </Backdrop>
  );
}

function useModal() {
  const context = useContext(ModalContext);
  if (!context) throw new DeveloperError('Must have Modal Provider to use this hook');
  return context;
}

// Deprecated -- but may want to use as guide to implement v2 version...
function useOpenModal<T extends ModalData['type'], M extends ModalData>(
  type: T,
): SelectedModalState<Extract<M, { type: T }>> {
  const context = useContext(ModalContext);
  if (!context) {
    throw new DeveloperError('Must have Modal Provider to use this hook');
  }
  if (!isModalSelected(context)) {
    throw new DeveloperError('Must have Modal Provider and open modal to use this hook');
  }

  if (!isModalMatchToType<T, M>(context, type)) {
    throw new DeveloperError('Open modal must match given type');
  }

  return context;
}

export { ModalProvider, useModal, useOpenModal, ModalManager };
