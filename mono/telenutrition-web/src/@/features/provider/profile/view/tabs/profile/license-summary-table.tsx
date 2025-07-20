import GenericTable, { SingleRowData } from '@/modules/data-table/generic-table';
import { Badge } from '@/ui-components/badge';
import { ColumnDef } from '@tanstack/react-table';
import { FetchProviderMeResult } from 'api/provider/useFetchProviderMe';
import { ProviderLicenseRecord } from 'api/types';
import useFormConsts from 'hooks/useFormConsts';
import { DateTime } from 'luxon';
import { Trans, useTranslation } from 'react-i18next';

interface LicenseSummaryTableProps {
  licenseSummary: FetchProviderMeResult['licenseSummary'];
}

export default function LicenseSummaryTable({ licenseSummary }: LicenseSummaryTableProps) {
  const { states } = useFormConsts();
  const { t } = useTranslation();

  const columns: ColumnDef<SingleRowData<ProviderLicenseRecord & { isValid: boolean }>>[] = [
    {
      accessorKey: 'licenseNumber',
      header: t('License'),
      cell: ({ row }) => <div className={'flex gap-2 items-center'}>
        {row.original.data.licenseNumber}
        {row.original.data.isValid ?
          <Badge leftIconName="check" variant="statusGreen">Valid</Badge> :
          <Badge leftIconName="alert-triangle" variant="statusRed">Not valid</Badge>}
      </div>,
    },
    {
      accessorKey: 'state',
      header: t('Location'),
      cell: ({ row }) => (
        <div>
          {states.find((st) => st.value === row.original.data.state)?.label ??
            row.original.data.state}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: t('Status'),
      cell: ({ row }) => {
        if (row.original.data.status === 'active') {
          return (
            <Badge leftIconName="dot" variant="statusGreen">
              <Trans>Active</Trans>
            </Badge>
          );
        }
        if (row.original.data.status === 'inactive') {
          return (
            <Badge leftIconName="dot" variant="statusRed">
              <Trans>Inactive</Trans>
            </Badge>
          );
        }
        if (row.original.data.status === 'pending') {
          return (
            <Badge leftIconName="dot" variant="statusAmber">
              <Trans>Pending</Trans>
            </Badge>
          );
        }
      },
    },
    {
      accessorKey: 'verificationStatus',
      header: t('Verificiation status'),
      cell: ({ row }) => {
        if (row.original.data.verificationStatus === 'needs_attention') {
          return (
            <Badge leftIconName="alert-triangle" variant="statusRed">
              <Trans>Needs attention</Trans>
            </Badge>
          );
        }
        if (row.original.data.verificationStatus === 'manually_verified') {
          return (
            <Badge leftIconName="check" variant="statusGreen">
              <Trans>Manually Verified</Trans>
            </Badge>
          );
        }
        if (row.original.data.verificationStatus === 'automatically_verified') {
          return (
            <Badge leftIconName="check" variant="statusGreen">
              <Trans>Automatically verified</Trans>
            </Badge>
          );
        }
      },
    },
    {
      accessorKey: 'expirationDate',
      header: t('Expiration date'),
      cell: ({ row }) => {
        return row.original.data.expirationDate ? (
          <div>
            {DateTime.fromFormat(row.original.data.expirationDate, 'yyyy-LL-dd').toFormat(
              'dd LLL yyyy',
            )}
          </div>
        ) : null;
      },
    },
  ];

  return (
    <GenericTable
      columns={columns}
      data={licenseSummary.licenses?.map((license) => ({ type: 'single', data: license })) ?? []}
    />
  );
}
