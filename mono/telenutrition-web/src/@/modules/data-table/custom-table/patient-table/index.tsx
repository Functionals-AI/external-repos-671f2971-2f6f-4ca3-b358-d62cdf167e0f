import * as React from 'react';

import { ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/ui-components/badge';

import { SortableColumnHeader } from '../../components/sortable-column-header';
import PatientTableRowDetail from './collapsible-content';
import GenericTable, { RowData } from '../../generic-table';
import { AsBasicDate, AsTime } from '@/modules/dates';
import type { Household, HouseholdMemberWithSchedulingInfo } from 'api/types';
import PatientSearch from './patient-search';
import { Trans, useTranslation } from 'react-i18next';
import useMemberHelpers from '@/modules/member/useMemberHelpers';

export type PatientTableRow = RowData<HouseholdMemberWithSchedulingInfo>;

type PatientTableType = 'patients' | 'households';

export default function PatientTable<
  Type extends PatientTableType,
  TData extends Household | HouseholdMemberWithSchedulingInfo = Type extends 'patients'
    ? HouseholdMemberWithSchedulingInfo
    : Household,
>({
  type,
  data,
  isTableHeaderHidden,
  isTablePaginationVisible,
  className,
}: {
  type: 'patients' | 'households';
  data: TData[];
  isTableHeaderHidden?: boolean;
  isTablePaginationVisible?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();

  const memberHelpers = useMemberHelpers();

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
        if (row.original.type === 'single') {
          const member = row.original.data;
          const age = memberHelpers.getMemberAge(member);
          return (
            <div className="flex flex-col">
              <h5>{memberHelpers.getDisplayNameForPatient(member).value}</h5>
              <label className="text-sm text-neutral-700 leading-4">
                {age} {member.sex}
              </label>
            </div>
          );
        } else {
          const members = row.original.subRows.map((r) => {
            return r.data;
          });
          return (
            <div className="flex flex-row items-center gap-x-4">
              <h5>
                {memberHelpers.getDisplayNameForPatient(members[0]).value} +{' '}
                {t('{{num}} more', { num: members.length - 1 })}
              </h5>
              <Badge variant="clear">
                <Trans>Household</Trans>
              </Badge>
            </div>
          );
        }
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
        if (row.original.type === 'nested') return null;
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
      accessorKey: 'nextSession',
      header: ({ column }) => {
        return (
          <SortableColumnHeader column={column}>
            <Trans>Next Session</Trans>
          </SortableColumnHeader>
        );
      },
      cell: ({ row }) => {
        if (row.original.type === 'nested') return null;
        const member = row.original.data;
        if (!member.nextSession)
          return (
            <div className="flex flex-col">
              <h5>-</h5>
            </div>
          );

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
          <SortableColumnHeader column={column}>
            <Trans>Last Session</Trans>
          </SortableColumnHeader>
        );
      },
      cell: ({ row }) => {
        if (row.original.type === 'nested') return null;
        const member = row.original.data;
        if (!member.lastSession)
          return (
            <div className="flex flex-col">
              <h5>-</h5>
            </div>
          );

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
  ];

  const tableRows: PatientTableRow[] =
    type === 'households'
      ? ((data as Household[])
          .map<PatientTableRow | null>((household) => {
            if (household.members.length === 0) return null;
            if (household.members.length === 1) {
              return {
                type: 'single',
                data: household.members[0],
              };
            }

            return {
              type: 'nested',
              subRows: household.members.map((member) => ({
                type: 'single',
                data: member,
              })),
            };
          })
          .filter((row) => !!row) as PatientTableRow[])
      : (data as HouseholdMemberWithSchedulingInfo[]).map((member) => ({
          type: 'single',
          data: member,
        }));

  const [filteredTalbeRows, setFilteredTableRows] = React.useState<PatientTableRow[]>(tableRows);

  return (
    <>
      {!isTableHeaderHidden && (
        <div data-testid={'patient-table-filter-search'}>
          <PatientSearch tableRows={tableRows} setFilteredTableRows={setFilteredTableRows} />
        </div>
      )}
      <GenericTable
        className={className}
        columns={columns}
        data={filteredTalbeRows}
        renderCollapsibleSection={(row) =>
          row.type === 'nested' ? null : <PatientTableRowDetail patient={row.data} />
        }
        isTableHeaderHidden={isTableHeaderHidden}
        isTablePaginationVisible={isTablePaginationVisible}
      />
    </>
  );
}
