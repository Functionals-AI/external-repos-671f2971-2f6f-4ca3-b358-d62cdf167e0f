import {
  SortableColumnHeader,
  SortableWorkingColumnHeader,
} from '@/modules/data-table/components/sortable-column-header';
import GenericTable, { SingleRowData } from '@/modules/data-table/generic-table';
import { Button } from '@/ui-components/button';
import ButtonBar from '@/ui-components/button/group';
import Section from '@/ui-components/section';
import { ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import useFetchProviderPatientHistory, {
  ProviderPatientAppointment,
} from 'api/provider/useFetchProviderPatientAppointments';
import { Badge } from '@/ui-components/badge';
import { Trans, useTranslation } from 'react-i18next';
import { AsBasicDate, AsTime } from '@/modules/dates';
import GetErrorDislpay from '@/modules/errors/get-error-display';
import ContainerLoading from '@/ui-components/loading/container-loading';
import { useFeatureFlags } from '@/modules/feature-flag';
import Icon from '@/ui-components/icons/Icon';
import { HouseholdMemberSchedulable, HouseholdMemberWithSchedulingInfo } from 'api/types';
import { getAppointmentComputedStatus } from '@/selectors/appointmentComputedStatus';
import { useModal } from '@/modules/modal';
import OverflowMenu from '../../../../../ui-components/dropdown-menu/overflow-menu';

export default function SessionHistoryTab({
  patient,
}: {
  patient: HouseholdMemberWithSchedulingInfo;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useFetchProviderPatientHistory(patient.patientId, {
    includeEncounterData: false,
  });
  const featureFlags = useFeatureFlags();
  const modal = useModal();

  const columns: ColumnDef<SingleRowData<ProviderPatientAppointment>>[] = [
    {
      id: 'appointmentId',
      accessorFn: (row) => row.data.appointment.appointmentId,
      header: ({ column }) => {
        return (
          <SortableWorkingColumnHeader column={column}>{t('Visit ID')}</SortableWorkingColumnHeader>
        );
      },
      cell: ({ row }) => {
        return <p>{row.original.data.appointment.appointmentId}</p>;
      },
    },
    {
      accessorFn: (row) => row.data.appointment.startTimestamp,
      id: 'startTimestamp',
      header: ({ column }) => {
        return <SortableColumnHeader column={column}>{t('Date')}</SortableColumnHeader>;
      },
      cell: ({ row }) => (
        <div className="flex flex-col">
          <p>
            <AsBasicDate format="LL dd yyyy">
              {row.original.data.appointment.startTimestamp}
            </AsBasicDate>
          </p>
          <p className="text-sm text-neutral-600">
            <AsTime>{row.original.data.appointment.startTimestamp}</AsTime>
          </p>
        </div>
      ),
    },
    {
      accessorFn: (row) => row.data.appointment.appointmentTypeDisplay,
      id: 'appointmentTypeDisplay',
      header: ({ column }) => {
        return <p className="font-normal">{t('Visit type')}</p>;
      },
      cell: ({ row }) => {
        return <p>{row.original.data.appointment.appointmentTypeDisplay}</p>;
      },
    },
    {
      accessorFn: (row) => row.data.appointment.provider?.name,
      id: 'providerName',
      header: ({ column }) => {
        return <p className="font-normal">{t('Provider')}</p>;
      },
      cell: ({ row }) => {
        return <p>{row.original.data.appointment.provider?.name}</p>;
      },
    },
    {
      accessorFn: (row) => row.data.appointment.duration,
      id: 'duration',
      header: ({ column }) => {
        return <p className="font-normal">{t('Visit duration')}</p>;
      },
      cell: ({ row }) => {
        return (
          <span className="flex gap-x-2 items-center">
            <Icon
              name={row.original.data.appointment.isAudioOnly ? 'video-off' : 'video'}
              color={row.original.data.appointment.isAudioOnly ? 'neutral-200' : 'blue'}
              size="xs"
            />
            <p>{row.original.data.appointment.duration} min</p>
          </span>
        );
      },
    },
    {
      accessorFn: (row) => row.data.appointment.status,
      id: 'status',
      header: ({ column }) => {
        return <p className="font-normal">{t('Status')}</p>;
      },
      cell: ({ row }) => {
        const computedAppointmentStatus = getAppointmentComputedStatus(
          row.original.data.appointment,
        );

        if (!computedAppointmentStatus) {
          return (
            <Badge leftIconName={'dot'} variant="neutral">
              {t('Unknown status')}
            </Badge>
          );
        }

        if (computedAppointmentStatus === 'canceled') {
          const isNoShow = row.original.data.appointment.cancelReasonId === 9;
          return (
            <Badge leftIconName={'dot'} variant="neutral">
              {isNoShow ? t('No Show') : t('Canceled')}
            </Badge>
          );
        }

        if (computedAppointmentStatus === 'complete') {
          return (
            <Badge leftIconName={'dot'} variant="statusGreen">
              {t('Complete')}
            </Badge>
          );
        }

        if (computedAppointmentStatus === 'incomplete') {
          return (
            <Badge leftIconName={'dot'} variant="statusAmber">
              {t('Incomplete')}
            </Badge>
          );
        }

        if (computedAppointmentStatus === 'upcoming' || computedAppointmentStatus === 'current') {
          return (
            <Badge leftIconName={'dot'} variant="statusAmber">
              {t('Upcoming')}
            </Badge>
          );
        }

        if (computedAppointmentStatus === 'needs-attention') {
          return (
            <Badge leftIconName={'dot'} variant="statusRed">
              {t('Missed')}
            </Badge>
          );
        }

        if (computedAppointmentStatus === 'oversight') {
          return (
            <Badge leftIconName={'dot'} variant="blue">
              {t('In Review')}
            </Badge>
          );
        }

        if (computedAppointmentStatus === 'provider-response-required') {
          return (
            <Badge leftIconName={'dot'} variant="statusAmber">
              {t('Provider Response Required')}
            </Badge>
          );
        }

        return (
          <Badge leftIconName={'dot'} variant="neutral">
            {t('Unknown status')}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: ({ column }) => <p></p>,
      cell: ({ row }) => {
        const { appointment } = row.original.data;

        if (featureFlags.hasFeature('thorough_scheduling_flow_ENG_1629')) {
          if (appointment.status === 'f') {
            return (
              <OverflowMenu
                items={[
                  {
                    label: t('Go to visit'),
                    onClick: () =>
                      router.push(
                        `/schedule/provider/session/${appointment.appointmentId}/details`,
                      ),
                  },
                  {
                    label: t('Reschedule visit'),
                    onClick: () =>
                      modal.openPrimary({
                        type: 'reschedule-session-v2',
                        rescheduleAppointment: appointment,
                      }),
                  },
                ]}
                type="visible"
              />
            );
          }
        }

        if (['f', '1', '2'].includes(appointment.status)) {
          return (
            <Button
              variant="secondary"
              onClick={() =>
                router.push(`/schedule/provider/session/${appointment.appointmentId}/meeting`)
              }
            >
              {appointment.status === 'f' ? <Trans>Go to visit</Trans> : <Trans>Go to chart</Trans>}
            </Button>
          );
        }

        if (['3', '4'].includes(appointment.status)) {
          return (
            <Button
              variant="secondary"
              onClick={() =>
                router.push(`/schedule/provider/session/${appointment.appointmentId}/details`)
              }
            >
              <Trans>View</Trans>
            </Button>
          );
        }
      },
    },
  ];

  if (isLoading) return <ContainerLoading />;
  if (error) return <GetErrorDislpay refetch={refetch} error={error} />;

  const rows: SingleRowData<ProviderPatientAppointment>[] = data.appointments.map((entry) => ({
    type: 'single',
    data: entry,
  }));

  return (
    <div className="py-4">
      <Section title={<Trans>Visit history</Trans>}>
        {featureFlags.hasFeature('thorough_scheduling_flow_ENG_1629') &&
          patient.schedulingInfo.canSchedule && (
            <ButtonBar className="justify-end !pt-0">
              <ButtonBar.Group>
                <Button
                  leftIcon={{ name: 'calendar' }}
                  variant="secondary"
                  onClick={() => {
                    modal.openPrimary({
                      type: 'schedule-session-v2',
                      patient: patient as HouseholdMemberSchedulable,
                    });
                  }}
                >
                  {t('Schedule sessions')}
                </Button>
              </ButtonBar.Group>
            </ButtonBar>
          )}
        <GenericTable
          columns={columns}
          data={rows}
          defaultSortingState={[{ id: 'startTimestamp', desc: true }]}
          isTablePaginationVisible
        />
      </Section>
    </div>
  );
}
