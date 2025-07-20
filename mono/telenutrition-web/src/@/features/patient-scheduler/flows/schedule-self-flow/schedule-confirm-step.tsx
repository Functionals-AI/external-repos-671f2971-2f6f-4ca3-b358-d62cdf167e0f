import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ColumnDef } from '@tanstack/react-table';
import { DateTime } from 'luxon';

import { useModal } from '@/modules/modal';
import Modal from '@/modules/modal/ui/modal';
import Section from '@/ui-components/section';
import DataDisplay from '@/ui-components/data-display';
import Icon from '@/ui-components/icons/Icon';
import { Badge } from '@/ui-components/badge';
import { useMultiStepFormContext } from '@/modules/multi-step-form';
import { SortableColumnHeader } from '@/modules/data-table/components/sortable-column-header';
import GenericTable, { SingleRowData } from '@/modules/data-table/generic-table';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import TimeDifferenceBadge from '@/smart-components/time-difference-badge';
import { getAllSessions, ScheduledSession } from '../../helpers';
import { SessionType } from 'types/globals';
import { HouseholdMemberSchedulable } from 'api/types';
import MultiStepForm from '@/modules/multi-step-form';
import { ManageScheduleForPatientFormFields } from '../../types';

export default function ScheduleConfirmStep({
  providerTimezone,
  patient,
}: {
  providerTimezone: string;
  patient: HouseholdMemberSchedulable;
}) {
  const { t } = useTranslation();
  const modal = useModal();
  const { form } = useMultiStepFormContext<ManageScheduleForPatientFormFields>();
  const memberHelpers = useMemberHelpers();

  const values = form.getValues();
  const patientDisplayName = memberHelpers.getDisplayNameForPatient(patient);

  const columns: ColumnDef<SingleRowData<ScheduledSession>>[] = [
    {
      accessorKey: 'date',
      header: ({ column }) => {
        return <SortableColumnHeader column={column}>{t('Date')}</SortableColumnHeader>;
      },
      cell: ({ row }) => (
        <div className="flex gap-x-6 items-center">
          <div>
            <h6 data-testid="schedule-date">
              {DateTime.fromJSDate(row.original.data.date)
                .setZone(providerTimezone)
                .toFormat('dd LLL yyyy')}
            </h6>
            <p>
              {DateTime.fromJSDate(row.original.data.date)
                .setZone(providerTimezone)
                .toFormat('h:mma ZZZZ')}
            </p>
          </div>
          <TimeDifferenceBadge
            timezone={patient.timezone}
            date={row.original.data.date}
            label={t('Member time')}
          />
          {row.original.data.isRecurring && (
            <div data-testid="recurring-icon">
              <Icon size="sm" name="refresh-cw" />
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'duration',
      header: ({ column }) => {
        return <SortableColumnHeader column={column}>{t('Duration')}</SortableColumnHeader>;
      },
      cell: ({ row }) => (
        <div>
          <Badge
            className="px-4"
            variant={row.original.data.sessionType === SessionType.AudioOnly ? 'neutral' : 'blue'}
            leftIconName={
              row.original.data.sessionType === SessionType.AudioOnly ? 'video-off' : 'video'
            }
          >
            {t('{{minutes}} minutes', { minutes: row.original.data.duration })}
          </Badge>
        </div>
      ),
    },
  ];

  return (
    <>
      <Modal.Header title={<Trans>Scheduling options</Trans>} />
      <Modal.Body>
        <Section title={t('Member')}>
          <DataDisplay label={t('Member')} content={<div>{patientDisplayName.value}</div>} />
        </Section>
        <Section title={t('Visit(s) being scheduled')}>
          <span className={'max-w-xl'}>
            <GenericTable
              columns={columns}
              data={getAllSessions(values).map((session) => ({ type: 'single', data: session }))}
            />
          </span>
        </Section>
      </Modal.Body>
      <MultiStepForm.BasicFooter
        secondaryButton={{
          children: t('Cancel'),
          onClick: () => {
            modal.openSecondary({
              type: 'basic-dialog',
              title: t('Discard changes?'),
              body: t('Changes will not be saved. Are you sure you want to discard these changes?'),
              theme: 'destructive',
              secondaryButton: {
                text: t('Go back'),
                onClick: () => modal.closeSecondary(),
              },
              primaryButton: {
                text: t('Discard'),
                onClick: () => {
                  modal.closeAll();
                },
              },
            });
          },
        }}
      />
    </>
  );
}
