import * as React from 'react';

import { ColumnDef } from '@tanstack/react-table';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui-components/dropdown-menu';
import { Pencil2Icon, TrashIcon } from '@radix-ui/react-icons';

import { PatientWeight, data } from './utils';
import { SortableColumnHeader } from '../../components/sortable-column-header';
import GenericTable, { SingleRowData } from '../../generic-table';
import { Button } from '@/ui-components/button';
import DataDisplay from '@/ui-components/data-display';
import Icon from '@/ui-components/icons/Icon';

interface PatientWeightSimpleTableProps {
  direction?: 'horizontal' | 'vertical';
  isAddable?: boolean;
}

interface PatientWeightTableProps {
  readOnly?: boolean;
  direction?: 'horizontal' | 'vertical';
}

export function PatientWeightSimpleTable({ direction, isAddable }: PatientWeightSimpleTableProps) {
  const columns: ColumnDef<SingleRowData<PatientWeight>>[] = React.useMemo(
    () => [
      {
        accessorKey: 'weight',
        header: ({ column }) => {
          return <SortableColumnHeader column={column}>Weight (lbs)</SortableColumnHeader>;
        },
        cell: ({ row }) => {
          const weight = row.original.data.weight;
          const date = row.original.data.date;
          return (
            <DataDisplay
              label=""
              content={weight}
              footer={<p className="text-sm text-neutral-700 leading-4">{date}</p>}
            />
          );
        },
      },
    ],
    [],
  );
  return (
    <GenericTable
      columns={columns}
      data={data.map((d) => ({ type: 'single', data: d }))}
      direction={direction}
      isAddable={isAddable}
    />
  );
}

export default function PatientWeightTable({ readOnly, direction }: PatientWeightTableProps) {
  const columns: ColumnDef<SingleRowData<PatientWeight>>[] = React.useMemo(
    () => [
      {
        accessorKey: 'weight',
        header: ({ column }) => {
          return (
            <SortableColumnHeader direction={direction} column={column}>
              Weight
            </SortableColumnHeader>
          );
        },
        cell: ({ row }) => {
          const weight = row.original.data.weight;
          return <h6>{weight} lbs</h6>;
        },
      },
      {
        accessorKey: 'date',
        header: ({ column }) => {
          return (
            <SortableColumnHeader direction={direction} column={column}>
              Date
            </SortableColumnHeader>
          );
        },
        cell: ({ row }) => {
          const date = row.original.data.date;
          return <h6>{date}</h6>;
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="tertiary" className="min-w-0 ring-transparent">
                    <Icon name="meatballs" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Pencil2Icon className="mr-1" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-f-red">
                    <TrashIcon className="mr-1" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [],
  );
  return (
    <GenericTable
      columns={readOnly ? columns.slice(0, -1) : columns}
      data={data.map((d) => ({ type: 'single', data: d }))}
      direction={direction}
    />
  );
}
