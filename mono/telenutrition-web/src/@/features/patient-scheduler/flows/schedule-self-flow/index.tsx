import React from 'react';
import { useModal } from '@/modules/modal';
import { Trans, useTranslation } from 'react-i18next';
import useToaster from 'hooks/useToaster';

import MultiStepForm, { useMultiStepForm } from '@/modules/multi-step-form';
import { useFetchProviderAppointments } from 'api/provider/useGetProviderAppointments';
import { AppointmentRecord, HouseholdMemberSchedulable } from 'api/types';
import CalendarStep from './calender-step';
import ScheduleConfirmStep from './schedule-confirm-step';
import GetErrorDisplay from '@/modules/errors/get-error-display';
import { ManageScheduleForPatientFormFields } from '../../types';
import usePostProviderAppointmentsBulk from 'api/provider/usePostProviderAppointmentsBulk';
import { SessionType } from 'types/globals';
import { useAppStateContext } from 'state/context';
import { getAllSessions, ScheduledSession } from '../../helpers';
import useMemberHelpers from "@/modules/member/useMemberHelpers";
import { DateTime } from "luxon";

export default function ScheduleSelfFlow({ patient }: { patient: HouseholdMemberSchedulable }) {
  const { data, error, refetch } = useFetchProviderAppointments({ patientId: patient.patientId });

  // cannot display loading here otherwise form will lose data
  if (error) return <GetErrorDisplay refetch={refetch} error={error} />;

  const { slots, timezone } = data ?? {};

  return <ScheduleForm patient={patient} timezone={timezone ?? 'America/Los_Angeles'} slots={slots} />;
}

const ScheduleForm = ({
  patient,
  timezone,
  slots,
}: {
  patient: HouseholdMemberSchedulable;
  timezone: string;
  slots?: AppointmentRecord[];
}) => {
  const { t } = useTranslation();
  const modal = useModal();

  const { post: postProviderAppointmentsBulk } = usePostProviderAppointmentsBulk();
  const { getAppState } = useAppStateContext();
  const toaster = useToaster();
  const memberHelpers = useMemberHelpers();

  function singleVisitToast(slot: ScheduledSession) {
    const displayDate = DateTime.fromJSDate(slot.date).setZone(timezone);
    return {
      title: 'Session scheduled',
      message: (
        <>
          <p>
            <Trans>Your session has been scheduled</Trans>:
          </p>
          <p>
            <Trans>Member</Trans>:{' '}
            {memberHelpers.getDisplayNameForPatient(patient).value}
          </p>
          <p>
            <Trans>Duration</Trans>:{' '}
            {`${t('{{minutes}} minutes', { minutes: slot.duration })}`}
          </p>
          <p>
            <Trans>Date</Trans>: {displayDate.toFormat('LL/dd/yyyy')}
          </p>
          <p>
            <Trans>Time</Trans>: {displayDate.toFormat('HH:mm')}
          </p>
        </>
      ),
    };
  }
  
  const multiStepForm = useMultiStepForm<ManageScheduleForPatientFormFields>({
    steps: [
      {
        render: () => <CalendarStep patient={patient} slots={slots} timezone={timezone} />,
      },
      {
        render: () => <ScheduleConfirmStep patient={patient} providerTimezone={timezone} />,
      },
    ],
    onComplete: async (values) => {
      
      try {
        const allSessions = getAllSessions(values);
        
        const res = await postProviderAppointmentsBulk({
          payload: {
            cid: getAppState().cid!,
            patient_id: patient.patientId,
            appointments: allSessions.map((session) => ({
              appointment_ids: session.appointmentIds,
              audio_only: session.sessionType === SessionType.AudioOnly ? true : false,
              is_follow_up: true,
            })),
          },
        })

        if (res.data.errors.length === 0) {
          const toast = (allSessions.length === 1)
            ? singleVisitToast(allSessions[0])
            : {
              title: t('Successfully scheduled multiple sessions'),
              message: t('Success'),
            };

          toaster.success(toast);
        } else {
          const failedSessionsData = res.data.errors.map((error) => {
            const found = allSessions.find((session) =>
              session.appointmentIds.includes(error.appointment.appointmentIds[0]),
            );

            if (found) return { error, sessionData: found };
            return { error };
          });

          toaster.warn({
            title: t('Some appointments failed to schedule'),
            message: t(
              '{{successes}} appointment(s) were successfully added, but {{errors}} appointment(s) could not be scheduled.',
              { successes: res.data.successes.length, errors: res.data.errors.length },
            ),
            // TODO: import scheduling errors modal
            /*cta: {
              children: t('Review appointments'),
              onClick: () =>
                modal.openPrimary({
                  type: 'custom',
                  modal: (
                    <SchedulingErrorDetailsModal
                      failedSessionsData={failedSessionsData}
                      successes={res.data.successes}
                    />
                  ),
                }),
            },*/
            options: {
              duration: 40000,
            },
          });
        }
      } catch (e) {
          toaster.apiError({ title: t('Failure to bulk schedule appointments'), error: e });
      }
      
      modal.closeAll();
    }
  });

  return (
    <MultiStepForm {...multiStepForm}>
      <MultiStepForm.Step />
    </MultiStepForm>
  );
};
