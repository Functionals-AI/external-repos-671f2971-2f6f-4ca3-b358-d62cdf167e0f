'use client';

import NonDashboardLayout from '@/layouts/non-dashboard';
import { Trans, useTranslation } from 'react-i18next';
import { useSessionContext } from './useSessionContext';
import InSession from './steps/in-session';
import { useEffect, useState, useCallback } from 'react';
import useApiClient from 'api/client';
import usePutUpdateAppointmentEncounter from 'api/encounter/usePutSaveAppointmentEncounter';
import { FormV2, FormV2ContextProvider } from '@/modules/form/form';
import ButtonBar from '@/ui-components/button/group';
import { Button } from '@/ui-components/button';
import { useModal } from '@/modules/modal';
import ConfirmCloseSessionModal, {
  CloseSessionActionType,
} from './components/confirm-close-session-modal';
import { useRouter } from 'next/navigation';
import _ from 'lodash';
import { ApiRequestError, DeveloperError } from 'utils/errors';
import usePutSubmitAppointmentEncounter from 'api/encounter/usePutSubmitAppointmentEncounter';
import useToaster from 'hooks/useToaster';
import { useFetchCache } from 'hooks/useFetch/context';
import { Duration } from 'luxon';
import BannerBar from '@/modules/banner/banner';
import { useDateHelpers } from '@/modules/dates';
import usePutResubmitAppointmentEncounter from 'api/encounter/usePutResubmitAppointmentEncounter';
import ReviewOversightNotesModal from './components/review-oversight-notes-modal';
import { EncounterStatus, EncounterOversightStatus } from 'api/types';

type ValidationError = {
  extra: {
    errors: {
      key: string;
      error: string;
    }[];
  };
};

function isValidationError(e: any): e is ValidationError {
  return e instanceof ApiRequestError && e.code === 'validation' && e.extra?.errors;
}
export default function ProviderPatientSessionFeatureWrapper() {
  const dateHelpers = useDateHelpers();
  const { data, form } = useSessionContext();
  const { encounterData } = data;
  const api = useApiClient();
  const modal = useModal();
  const router = useRouter();
  const toaster = useToaster();
  const { t } = useTranslation();
  const fetchCache = useFetchCache();

  const [lastUpdate, setLastUpdate] = useState(() => _.cloneDeep(form.getValues()));

  const { post: putSubmitAppointmentEncounter } = usePutSubmitAppointmentEncounter(
    encounterData.encounter?.encounterId!,
  );

  const { post: putResubmitAppointmentEncounter } = usePutResubmitAppointmentEncounter(
    encounterData.encounter?.encounterId!,
  );

  const { post: putSaveAppointmentEncounter } = usePutUpdateAppointmentEncounter(
    encounterData.encounter?.encounterId!,
  );

  const saveProgress = useCallback(async () => {
    if (encounterData.encounter) {
      const chartingData = form.getValues();
      // dont send update if nothing has changed
      if (_.isEqual(lastUpdate, chartingData) || _.isEmpty(chartingData)) {
        return;
      }

      return putSaveAppointmentEncounter({
        payload: { chartingData },
      }).then(() => {
        setLastUpdate(_.cloneDeep(chartingData));
      });
    }
  }, [lastUpdate, form, encounterData]);

  async function saveAndClose() {
    saveProgress()
      .then(() => {
        toaster.success({ title: t('Successfully saved encounter') });
        modal.closeAll();
        router.push('/schedule/provider/dashboard');
      })
      .catch((error) => {
        toaster.apiError({ title: t('Unable to save encounter'), error });
      });
  }

  useEffect(() => {
    const interval = setInterval(() => {
      saveProgress().catch((e) => {
        console.log('Encounter update error: ', e);
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [encounterData.encounter, saveProgress]);

  useEffect(() => {
    return () => {
      fetchCache.invalidateCacheKey(['appointment-encounter']);
      fetchCache.invalidateCacheKey(['provider', 'appointments']);
    };
  }, []);

  function openFinalizeModal({ formData }: { formData: Record<string, any> }) {
    const { start_time, end_time, interventions, intervention_notes, units_billed } = formData;

    const startDuration = Duration.fromISOTime(start_time);
    const endDuration = Duration.fromISOTime(end_time);

    if (endDuration < startDuration) {
      form.setError('end_time', { message: t('End time must be after start time') });
      return;
    }

    if (!interventions?.filter((i: string | null) => !!i).length && !intervention_notes) {
      form.setError('intervention_notes', {
        message: t('At least one intervention or an intervention note is required.'),
      });
      return;
    }

    if (units_billed == undefined || units_billed == null) {
      form.setError('units_billed', { message: t('Units billed is required.') });
      return;
    }

    modal.openPrimary({
      type: 'custom',
      modal: (
        <ConfirmCloseSessionModal
          data={data}
          formData={{
            startDuration,
            endDuration,
            unitsBilled: units_billed,
          }}
          onConfirm={(value) => {
            if (value.action === CloseSessionActionType.SaveAndKeepInMyTasks) {
              saveAndClose();
            } else if (
              value.action === CloseSessionActionType.FinalizeAndSubmitToBilling ||
              value.action === CloseSessionActionType.SendToMdOversight
            ) {
              const action =
                encounterData.encounter?.oversightStatus ===
                  EncounterOversightStatus.ProviderResponseRequired
                  ? putResubmitAppointmentEncounter
                  : putSubmitAppointmentEncounter;

              action({ payload: { chartingData: formData } })
                .then(() => {
                  toaster.success({ title: t('Session successfully finalized') });
                })
                .catch((e) => {
                  let message;
                  if (isValidationError(e)) {
                    const { errors } = e.extra;
                    for (const error of errors) {
                      form.setError(error.key, { message: error.error });
                    }
                    message = errors.map((e) => `${e.key}: ${e.error}`).join('\n');
                  }
                  toaster.apiError({ error: e, title: t('Failed to finalize session'), message });
                })
                .finally(() => {
                  modal.closeAll();
                });
            } else {
              throw new DeveloperError('');
            }
          }}
        />
      ),
    });
  }

  function openSaveAndCloseModal() {
    modal.openPrimary({
      type: 'basic-dialog',
      title: t('Save and close session?'),
      body: t(
        'Are you sure you want to save and close the session without finalizing? Your changes will be saved.',
      ),
      secondaryButton: {
        text: t('Cancel'),
        onClick: () => {
          modal.closeAll();
        },
      },
      primaryButton: {
        text: t('Done'),
        onClick: () => {
          saveAndClose();
        },
      },
    });
  }

  function handleExitBeforeStart() {
    router.push('/schedule/provider/dashboard');
  }

  function handleSubmit(values: Record<string, any>) {
    openFinalizeModal({ formData: values });
  }

  function openReviewOversightNotesModal() {
    if (!encounterData.encounter) {
      throw new DeveloperError(
        'Should not allow opening review oversight notes modal if encounter is undefined',
      );
    }

    modal.openPrimary({
      type: 'custom',
      modal: <ReviewOversightNotesModal encounter={encounterData.encounter} />,
    });
  }

  useEffect(() => {
    if (form.formState.submitCount === 0) return;
    try {
      const errors = form.formState.errors;

      if (Object.keys(errors).length > 0) {
        // TODO: need a more reliable way to get first error, this doesn't preserve order
        const firstErrorKey = Object.keys(errors)[0];
        const firstErrorInput = document.getElementById(`widget-question-${firstErrorKey}`);
        const container = document.getElementById('charting-form-container');

        if (firstErrorInput && container) {
          const elementRect = firstErrorInput.offsetTop;

          container.scrollTo({ top: elementRect - 100, behavior: 'smooth' });
        }
      }
    } catch (e) {
      console.error('Error scrolling to first error', e);
    }
  }, [form.formState.errors, form.formState.submitCount]);

  return (
    <FormV2 form={form} onSubmit={handleSubmit}>
      <FormV2ContextProvider value={{ config: { showOptionalLabel: false } }}>
        <NonDashboardLayout>
          <NonDashboardLayout.Header className="h-20" />
          {encounterData.oversightRequired &&
          (
            encounterData.encounter?.oversightStatus ===
              EncounterOversightStatus.ProviderResponseRequired
          ) && (
              <BannerBar
                dataTestId="oversight-review-banner"
                className="w-full px-6 md:px-10 lg:px-14 xl:px-16 border-b border-b-neutral-150 z-20 -mt-1"
                banner={{
                  type: 'warn',
                  size: 'large',
                  message: t('Physician oversight review requires corrections'),
                  description: t(
                    'Review the notes, make changes, and resubmit for physician review.',
                  ),
                  action: {
                    title: t('Review notes'),
                    onClick: () => openReviewOversightNotesModal(),
                  },
                }}
              />
            )}
          <NonDashboardLayout.Content>
            <InSession />
          </NonDashboardLayout.Content>
          <NonDashboardLayout.Footer>
            <ButtonBar borderTop className="w-full h-16 px-2 py-1 items-center justify-end">
              <ButtonBar.Group>
                {encounterData.encounter ? (
                  <>
                    <Button
                      dataTestId="save-and-close-encounter-button"
                      onClick={openSaveAndCloseModal}
                      variant="secondary"
                    >
                      <Trans>Save and close</Trans>
                    </Button>
                    <Button dataTestId="open-finalize-modal-button" type="submit">
                      <Trans>Finalize</Trans>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={handleExitBeforeStart} variant="secondary">
                      <Trans>Exit</Trans>
                    </Button>
                  </>
                )}
              </ButtonBar.Group>
            </ButtonBar>
          </NonDashboardLayout.Footer>
        </NonDashboardLayout>
      </FormV2ContextProvider>
    </FormV2>
  );
}
