import { ColumnDef, PaginationState } from '@tanstack/react-table';

import { Badge } from '@/ui-components/badge';

import {
  SortableColumnHeader,
  SortableWorkingColumnHeader,
} from '../../components/sortable-column-header';
import { AsBasicDate, AsTime } from '@/modules/dates';
import type { HouseholdMemberSchedulable, HouseholdMemberWithSchedulingInfo } from 'api/types';
import { Trans, useTranslation } from 'react-i18next';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import PaginatedTable, { SingleRowData } from '../../paginated-table';
import OverflowMenu, { OverflowMenuItem } from '@/ui-components/dropdown-menu/overflow-menu';
import PatientRowDetail from './patient-row-detail';
import { useRouter } from 'next/navigation';
import { useModal } from '@/modules/modal';
import { Dispatch, SetStateAction } from 'react';

export type PatientTableRow = SingleRowData<HouseholdMemberWithSchedulingInfo>;

export default function PaginatedPatientTable({
  data = [],
  total,
  isTableHeaderHidden,
  className,
  pagination,
  setPagination,
  loading,
}: {
  data?: HouseholdMemberWithSchedulingInfo[];
  total: number;
  isTableHeaderHidden?: boolean;
  className?: string;
  pagination: PaginationState;
  setPagination: Dispatch<SetStateAction<PaginationState>>;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();

  const memberHelpers = useMemberHelpers();
  const modal = useModal();

  const goToPatientInfo = (patientId: number) => {
    router.push(`/schedule/provider/patient/${patientId}/profile/view`);
  };

  const gotoPatientEdit = (patientId: number) => {
    router.push(`/schedule/provider/patient/${patientId}/profile/edit`);
  };

  const openScheduleSessionModal = (member: HouseholdMemberWithSchedulingInfo) => {
    modal.openPrimary({
      type: 'schedule-session-v2',
      patient: member as HouseholdMemberSchedulable,
    });
  };

  const columns: ColumnDef<PatientTableRow>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <SortableColumnHeader column={column}>
            <Trans>Member</Trans>
          </SortableColumnHeader>
        );
      },
      cell: ({ row }) => {
        const member = row.original.data;
        return (
          <div className="flex flex-col">
            <h5 className="text-neutral-1500 text-base">
              {memberHelpers.getDisplayNameForPatient(member).value}
            </h5>
            <label className="text-sm text-neutral-600 leading-4">{member.patientId}</label>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => {
        return (
          <SortableColumnHeader column={column}>
            <Trans>Status</Trans>
          </SortableColumnHeader>
        );
      },
      cell: ({ row }) => {
        const status: { type: 'active' } | { type: 'inactive'; error: React.ReactNode } = (() => {
          if (row.original.data.schedulingInfo.canSchedule) return { type: 'active' };

          const errorDisplay = memberHelpers.getErrorSchedulabilityDisplay(
            row.original.data.schedulingInfo,
          );

          return { type: 'inactive', error: errorDisplay.shortError };
        })();

        return (
          <Badge
            variant={status.type === 'active' ? 'statusGreen' : 'statusRed'}
            leftIconName={'dot'}
          >
            {status.type === 'active' ? <Trans>Active</Trans> : status.error}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'birthdate',
      header: ({ column }) => {
        return (
          <SortableColumnHeader column={column}>
            <Trans>Birthdate</Trans>
          </SortableColumnHeader>
        );
      },
      cell: ({ row }) => {
        const member = row.original.data;
        return (
          <div className="flex flex-col">
            <label className="text-sm text-neutral-700 leading-4">{member.birthday ?? '-'}</label>
          </div>
        );
      },
    },
    {
      accessorKey: 'phoneNumber',
      header: ({ column }) => {
        return (
          <SortableColumnHeader column={column}>
            <Trans>Phone number</Trans>
          </SortableColumnHeader>
        );
      },
      cell: ({ row }) => {
        const member = row.original.data;
        return <div>{member.phone}</div>;
      },
    },
    {
      accessorKey: 'nextSession',
      header: ({ column }) => {
        return (
          <SortableWorkingColumnHeader column={column}>
            <Trans>Next Session</Trans>
          </SortableWorkingColumnHeader>
        );
      },
      cell: ({ row }) => {
        const member = row.original.data;
        if (!member.nextSession) {
          return (
            <div className="flex flex-col">
              <h5>-</h5>
            </div>
          );
        }

        return (
          <div className="flex flex-col">
            <h5>
              <AsBasicDate>{member.nextSession}</AsBasicDate>
            </h5>
            <label className="text-sm text-neutral-700 leading-4">
              <AsTime>{member.nextSession}</AsTime>
            </label>
          </div>
        );
      },
    },
    {
      accessorKey: 'lastSession',
      header: ({ column }) => {
        return (
          <SortableWorkingColumnHeader column={column}>
            <Trans>Last Session</Trans>
          </SortableWorkingColumnHeader>
        );
      },
      cell: ({ row }) => {
        const member = row.original.data;
        if (!member.lastSession) {
          return (
            <div className="flex flex-col">
              <h5>-</h5>
            </div>
          );
        }

        return (
          <div className="flex flex-col">
            <h5>
              <AsBasicDate>{member.lastSession}</AsBasicDate>
            </h5>
            <label className="text-sm text-neutral-700 leading-4">
              <AsTime>{member.lastSession}</AsTime>
            </label>
          </div>
        );
      },
    },
    {
      accessorKey: 'actions',
      header: () => '',
      cell: ({ row }) => {
        const member = row.original.data;

        const items: OverflowMenuItem[] = [
          {
            label: t('Schedule visit'),
            onClick: () => {
              openScheduleSessionModal(member);
            },
          },
          'separator',
          {
            label: t('View member details'),
            onClick: () => goToPatientInfo(member.patientId),
          },
          {
            label: t('Edit member details'),
            onClick: () => gotoPatientEdit(member.patientId),
          },
        ];

        return <OverflowMenu items={items} type="hover-only" buttonVariant="tertiary" />;
      },
    },
  ];

  const tableRows: PatientTableRow[] = data.map((member) => ({
    type: 'single',
    data: member,
  }));

  return (
    <PaginatedTable
      className={className}
      columns={columns}
      data={tableRows}
      renderCollapsibleSection={(row) => {
        return <PatientRowDetail patient={row.data} />;
      }}
      isTableHeaderHidden={isTableHeaderHidden}
      pagination={pagination}
      setPagination={setPagination}
      totalRows={total}
      loading={loading}
    />
  );
}
