import * as React from 'react';

import { ColumnDef } from '@tanstack/react-table';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui-components/dropdown-menu';
import { Pencil2Icon, TrashIcon } from '@radix-ui/react-icons';

import { PatientProgram, data } from './utils';
import { SortableColumnHeader } from '../../components/sortable-column-header';
import { Badge } from '@/ui-components/badge';
import GenericTable, { SingleRowData } from '../../generic-table';
import { Button } from '@/ui-components/button';
import Icon from '@/ui-components/icons/Icon';

const columns: ColumnDef<SingleRowData<PatientProgram>>[] = [
  {
    accessorKey: 'module',
    header: ({ column }) => {
      return <SortableColumnHeader column={column}>Module</SortableColumnHeader>;
    },
    cell: ({ row }) => <h6>{row.original.data.module}</h6>,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      return <SortableColumnHeader column={column}>Progress</SortableColumnHeader>;
    },
    cell: ({ row }) => {
      const status = row.original.data.status;
      if (status === 'completed') return <Badge leftIconName="dot">Complete</Badge>;
      if (status === 'in progress')
        return (
          <Badge leftIconName="dot" variant="statusAmber">
            In progress
          </Badge>
        );
      return null;
    },
  },
  {
    accessorKey: 'assigned',
    header: ({ column }) => {
      return <SortableColumnHeader column={column}>Assigned</SortableColumnHeader>;
    },
    cell: ({ row }) => <h6>{row.original.data.assigned}</h6>,
  },
  {
    accessorKey: 'started',
    header: ({ column }) => {
      return <SortableColumnHeader column={column}>Started</SortableColumnHeader>;
    },
    cell: ({ row }) => <h6>{row.original.data.started}</h6>,
  },
  {
    accessorKey: 'completed',
    header: ({ column }) => {
      return <SortableColumnHeader column={column}>Completed</SortableColumnHeader>;
    },
    cell: ({ row }) => <h6>{row.original.data.completed ?? '-'}</h6>,
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
];

export default function PatientProgramTable({ readOnly }: { readOnly?: boolean }) {
  return (
    <GenericTable
      columns={readOnly ? columns.slice(0, -1) : columns}
      data={data.map((d) => ({ type: 'single', data: d }))}
    />
  );
}
