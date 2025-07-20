import MeetingLink from '../session-patient-display/meeting-link';
import { Button, ButtonProps } from '@/ui-components/button';
import { useSessionContext } from '../../useSessionContext';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import { Trans, useTranslation } from 'react-i18next';
import { useDateHelpers } from '@/modules/dates';
import { ReactNode } from 'react';
import { useModal } from '@/modules/modal';
import ScreeningQuestionnaireResultModal from 'modules/provider/appointment/screening-questionniare-result-modal';
import ScreeningQuestionnaireModal from '@/modules/modal/modals/screening-questionnaire';
import Card from '@/ui-components/card';
import LinkButton from '@/ui-components/button/link';
import StickyNoteBar from '@/smart-components/sticky-note-bar';
import SessionActionsDropdown from './session-actions';
import CollapsibleItemsList from './collapsible-items-list';
import { DateTime } from 'luxon';
import VisitLengthTimer from '@/features/provider/patient/session/components/visit-length-timer';
import AccountInfo from '@/smart-components/account-info';
import { useFeatureFlags } from '@/modules/feature-flag';

const ELEVANCE_ACCOUNT_ID = 45;
const ELEVANCE_FINDHELP_SSO_LINK = 'https://communityresourcelink.anthem.com/access/sso';

export default function SessionPatientDisplay() {
  const featureFlags = useFeatureFlags();
  const { t } = useTranslation();
  const memberHelpers = useMemberHelpers();
  const modal = useModal();
  const dateHelpers = useDateHelpers();
  const {
    data: { appointmentDetails, questionnaires, encounterData },
  } = useSessionContext();

  const patientName = memberHelpers.getDisplayNameFromAppointment({
    appointment: appointmentDetails.appointment,
  });

  const appointment = appointmentDetails.appointment;
  const patient = appointment.patient!;
  const meetingLink = appointmentDetails.appointment.meeting?.shortLink;
  const showPatientReferralViaFindhelp = patient?.accountId === ELEVANCE_ACCOUNT_ID;
  const hasNutriquiz = appointmentDetails.hasNutriquiz;
  const lastNutriquizCompletion = appointmentDetails.lastNutriquizCompletion;
  const screeningQuestionnaires = questionnaires ?? [];

  function openMemberDetailsNewTab() {
    window.open(`/schedule/provider/patient/${patient.patientId}/profile/view`, '_blank');
  }

  const appointmentDetailRows: { label: string; value: ReactNode }[] = [
    {
      label: t('Visit date'),
      value: (
        <div className="flex flex-col gap-y-1">
          <span>{dateHelpers.asBasicDate(appointment.startTimestamp, 'full')}</span>
          <span className="text-sm text-neutral-600">
            {dateHelpers.asTime(appointment.startTimestamp)}
          </span>
        </div>
      ),
    },
    { label: t('Visit ID'), value: appointment.appointmentId },
    {
      label: t('Visit type'),
      value: appointment.appointmentTypeDisplay || appointment.appointmentTypeId,
    },
    { label: t('Duration'), value: `${appointment.duration} minutes` },
    { label: t('Connection'), value: appointment.isAudioOnly ? 'Audio' : 'Video' },
  ];

  return (
    <div className="flex flex-col gap-y-2 w-full max-w-[30rem] max-h-[80vh] h-full overflow-y-scroll">
      <div className="pb-4 sticky top-0 bg-white z-50">
        <div className="flex justify-between pr-1 pt-1">
          <div className="flex items-center gap-x-2">
            <h5 className="text-neutral-1500 text-2xl">{patientName}</h5>
            <Button
              onClick={() => openMemberDetailsNewTab()}
              size="sm"
              variant="tertiary"
              leftIcon={{ name: 'external-link' }}
            >
              <Trans>Member details</Trans>
            </Button>
          </div>
          <SessionActionsDropdown appointment={appointment} />
        </div>
        <p className="text-neutral-600 text-sm">
          ID {appointmentDetails.appointment.patient!.patientId}
        </p>
        <div>
          <VisitLengthTimer />
        </div>
        <StickyNoteBar
          patientId={patient.patientId}
          sourceType="appointment"
          sourceId={appointmentDetails.appointment.appointmentId}
        />
      </div>
      <Card>
        {appointmentDetailRows.map((row) => (
          <Card.Row key={row.label}>
            <Card.Row.Label className="px-4 py-4 w-32">{row.label}</Card.Row.Label>
            <Card.Row.Col className="px-4 py-4">{row.value}</Card.Row.Col>
          </Card.Row>
        ))}
      </Card>
      {meetingLink && <MeetingLink meetingLink={meetingLink} />}
      {showPatientReferralViaFindhelp && (
        <div className="flex flex-col gap-y-2 justify-start">
          <h4>Links</h4>
          <LinkButton
            iconName="external-link"
            className="self-start"
            onClick={() => {
              window.open(ELEVANCE_FINDHELP_SSO_LINK, '_blank');
            }}
          >
            FindHelp
          </LinkButton>
        </div>
      )}
      {hasNutriquiz && (
        <LinkSection
          title={<Trans>Nutriquiz</Trans>}
          description={
            lastNutriquizCompletion &&
            `Last completed: ${new Date(lastNutriquizCompletion).toLocaleDateString()}`
          }
          buttonProps={{
            children: <Trans>Take Nutriquiz</Trans>,
            onClick: () => {
              window.open(
                `/schedule/provider/foodapp?patient_id=${
                  appointment.patientId
                }&path=${encodeURIComponent('/survey/complete-nutriquiz')}`,
                '_blank',
              );
            },
          }}
        />
      )}
      {screeningQuestionnaires.map((sq) =>
        sq.status === 'determined' ? (
          <LinkSection
            key={sq.title}
            title={<Trans>Risk Assessment</Trans>}
            buttonProps={{
              children: <Trans>View results</Trans>,
              onClick: () => {
                modal.openPrimary({
                  type: 'custom',
                  modal: <ScreeningQuestionnaireResultModal data={sq} />,
                });
              },
            }}
            description={
              sq.lastTakenAt
                ? t('Last taken: {{date}}', {
                    date: dateHelpers.asBasicDate(
                      DateTime.fromISO(sq.lastTakenAt, { zone: 'utc' }),
                    ),
                  })
                : t('Never taken')
            }
          />
        ) : (
          <LinkSection
            key={sq.title}
            title={<Trans>Risk Assessment</Trans>}
            buttonProps={{
              children: <Trans>Take risk assessment</Trans>,
              onClick: () => {
                modal.openPrimary({
                  type: 'custom',
                  modal: (
                    <ScreeningQuestionnaireModal
                      appointmentId={appointment.appointmentId}
                      questionnaire={sq}
                      experimental={true}
                    />
                  ),
                });
              },
            }}
            description={
              sq.lastTakenAt
                ? t('Last taken: {{date}}', {
                    date: dateHelpers.asBasicDate(
                      DateTime.fromISO(sq.lastTakenAt, { zone: 'utc' }),
                    ),
                  })
                : t('Never taken')
            }
          />
        ),
      )}
      {featureFlags.hasFeature('coverage_visibility_ENG_2371') && (
        <>
          <h3 className="text-xl font-semibold">Coverage</h3>
          {!!appointment.patient?.accountName && (
            <p className="text-neutral-700 text-sm mb-1">
              <Trans>Account: </Trans>
              {appointment.patient?.accountName}
            </p>
          )}

          <AccountInfo appointmentDetails={appointmentDetails} />
        </>
      )}
      <CollapsibleItemsList />
    </div>
  );
}

function LinkSection({
  title,
  buttonProps,
  description,
}: {
  title: ReactNode;
  buttonProps: ButtonProps;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-y-2">
      <h4 className="font-semibold text-xl">{title}</h4>
      <div className="flex flex-col gap-y-1 pl-1">
        <Button className="w-fit" size="sm" variant="secondary" {...buttonProps} />
        {description && <p className="text-sm text-neutral-600">{description}</p>}
      </div>
    </div>
  );
}
