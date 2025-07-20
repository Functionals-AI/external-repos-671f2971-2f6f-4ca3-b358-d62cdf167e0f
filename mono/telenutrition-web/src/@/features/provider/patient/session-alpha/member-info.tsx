import { useModal } from '@/modules/modal';
import ScreeningQuestionnaireModal from '@/modules/modal/modals/screening-questionnaire';
import { Button, ButtonProps } from '@/ui-components/button';
import Card from '@/ui-components/card';
import DataDisplay from '@/ui-components/data-display';
import Icon from '@/ui-components/icons/Icon';
import Section from '@/ui-components/section';
import { AppointmentDetail } from 'api/provider/useFetchProviderAppointmentDetail';
import { UseGetAppointmentByIdReturn } from 'api/useGetAppointmentById';
import ScreeningQuestionnaireResultModal from 'modules/provider/appointment/screening-questionniare-result-modal';
import { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useDateHelpers } from '@/modules/dates';
import { DateTime } from 'luxon';

const statusValues: Record<string, string> = {
  o: 'Open',
  f: 'Booked',
  x: 'Cancelled',
  '2': 'Checked In',
  '3': 'Checked Out',
  '4': 'Charge Entered',
};

const ELEVANCE_ACCOUNT_ID = 45;
const ELEVANCE_FINDHELP_SSO_LINK = 'https://communityresourcelink.anthem.com/access/sso';

interface SessionMemberInfoProps {
  appointmentById: UseGetAppointmentByIdReturn;
  appointmentDetail: AppointmentDetail;
}

export default function SessionMemberInfo({
  appointmentById,
  appointmentDetail,
}: SessionMemberInfoProps) {
  const { t } = useTranslation();
  const { appointment } = appointmentById;
  const { patient } = appointment;
  const modal = useModal();
  const dateHelpers = useDateHelpers();

  const showPatientReferralViaFindhelp = patient?.accountId === ELEVANCE_ACCOUNT_ID;

  function navigateToPatientInfo(patientId: number) {
    window.open(`/schedule/provider/patient/${patientId}/profile/view`, '_blank');
  }
  const screeningQuestionnaires = appointmentDetail.questionnaires ?? [];

  const hasNutriquiz = appointmentById.hasNutriquiz;
  const lastNutriquizCompletion = appointmentById.lastNutriquizCompletion;

  const statusValue = statusValues[status];
  const appointmentTypeDisplayValue =
    appointment.appointmentTypeDisplay ?? appointment.appointmentTypeId ?? null;

  return (
    <Card style={{ flex: 3 }} className="p-4 flex flex-col gap-y-6">
      <Card.Row className="pb-6">
        <Section title={t('Details')}>
          {appointmentTypeDisplayValue && (
            <DataDisplay label={t('Appointment type')} content={appointmentTypeDisplayValue} />
          )}
          <DataDisplay label={t('Appointment id')} content={appointment.appointmentId} />
          {statusValue && <DataDisplay label={t('Status')} content={statusValue} />}
        </Section>
      </Card.Row>
      <Card.Row className="pb-6">
        <Section className="@sm:flex-row" title={t('Links')}>
          <div className="flex flex-col items-start gap-y-2">
            {appointment.patient?.patientId && (
              <Button
                onClick={() => navigateToPatientInfo(appointment.patient!.patientId)}
                size="sm"
                variant="secondary"
              >
                <Icon name="external-link" color="neutral" size="sm" />
                <Trans>Member Details</Trans>
              </Button>
            )}
            {showPatientReferralViaFindhelp && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  window.open(ELEVANCE_FINDHELP_SSO_LINK, '_blank');
                }}
              >
                <Icon name="external-link" color="neutral" size="sm" />
                FindHelp
              </Button>
            )}
            {screeningQuestionnaires.map((sq) => (
              <div key={sq.questionnaireType} className="flex gap-x-4 items-center mt-2">
                {sq.status === 'determined' ? (
                  <Button
                    onClick={() => {
                      modal.openPrimary({
                        type: 'custom',
                        modal: <ScreeningQuestionnaireResultModal data={sq} />,
                      });
                    }}
                  >
                    {t(`View {{title}} Result`, { title: sq.title })}
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      modal.openPrimary({
                        type: 'custom',
                        modal: (
                          <ScreeningQuestionnaireModal
                            appointmentId={appointmentById.appointment.appointmentId}
                            questionnaire={sq}
                            experimental={true}
                          />
                        ),
                      });
                    }}
                  >
                    {t(`Take {{title}}`, { title: sq.title })}
                  </Button>
                )}
                <label className="text-sm text-type-secondary leading-4">
                  {sq.lastTakenAt
                    ? t('Last taken on {{date}}', {
                        date: dateHelpers.asBasicDate(
                          DateTime.fromISO(sq.lastTakenAt, { zone: 'utc' }),
                        ),
                      })
                    : t('Never taken')}
                </label>
              </div>
            ))}
            {hasNutriquiz && (
              <ActionRow
                label={
                  lastNutriquizCompletion &&
                  `Last completed: ${new Date(lastNutriquizCompletion).toLocaleDateString()}`
                }
                buttonProps={{
                  children: <Trans>Take Nutriquiz</Trans>,
                  variant: 'secondary',
                  onClick: () =>
                    window.open(
                      `/schedule/provider/foodapp?patient_id=${
                        appointment.patientId
                      }&path=${encodeURIComponent('/survey/complete-nutriquiz')}`,
                      '_blank',
                    ),
                }}
              />
            )}
          </div>
        </Section>
      </Card.Row>
      {patient && (
        <Card.Row className="pb-6">
          <Section className="@sm:flex-row" title={t('Contact')}>
            <div className="flex flex-col items-start gap-y-6">
              <DataDisplay label={t('Member phone number')} content={patient.phone ?? '-'} />
              <DataDisplay label={t('Member email')} content={patient.email ?? '-'} />
              <DataDisplay label={t('Account email')} content={patient.accountEmail ?? '-'} />
              <DataDisplay label={t('Account phone')} content={patient.accountPhone ?? '-'} />
              {!patient.accountEmail && !patient.accountPhone && (
                <DataDisplay
                  label={t('Account Info')}
                  content={
                    <span className="italic">
                      {t('User account does not exist for this patient')}
                    </span>
                  }
                />
              )}
              <DataDisplay label={t('Date of birth')} content={patient.birthday ?? '-'} />
              <DataDisplay label={t('Gender')} content={patient.sex ?? '-'} />
              <DataDisplay label={t('State')} content={patient.state ?? '-'} />
              <DataDisplay label={t('Timezone')} content={patient.timezone ?? '-'} />
            </div>
          </Section>
        </Card.Row>
      )}
    </Card>
  );
}

interface ActionRowProps {
  buttonProps: ButtonProps;
  label?: ReactNode;
}

function ActionRow({ buttonProps, label }: ActionRowProps) {
  return (
    <div className="flex flex-col">
      <div className="flex gap-x-2 items-center">
        <Button {...buttonProps} />
      </div>
      {label && <p>{label}</p>}
    </div>
  );
}
