import * as React from 'react';

import {
  ColumnDef,
  ExpandedState,
  SortingState,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  PaginationState,
} from '@tanstack/react-table';

import { TableCell, TableRow } from '@/ui-components/table';

import { RealPagination } from '../components/real-pagination';
import { Dispatch, SetStateAction } from 'react';
import TableDisplay from '../generic-table/table-display';

export type SingleRowData<TData> = {
  type: 'single';
  data: TData;
};

export type RowData<TData> = SingleRowData<TData>;

export function usePaginationState() {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  return { pagination, setPagination };
}

interface PaginatedTableProps<TData, TValue, RowType extends RowData<TData>> {
  className?: string;
  columns: ColumnDef<RowType, TValue>[];
  data: RowType[];
  direction?: 'horizontal' | 'vertical';
  isTableHeaderHidden?: boolean;
  renderCollapsibleSection?: (item: RowType) => React.ReactNode;
  defaultSortingState?: SortingState;
  totalRows: number;
  pagination: PaginationState;
  setPagination: Dispatch<SetStateAction<PaginationState>>;
  loading?: boolean;
}

export default function PaginatedTable<TData, TValue, RowType extends RowData<TData>>({
  className,
  columns,
  data,
  direction,
  isTableHeaderHidden,
  renderCollapsibleSection,
  totalRows,
  pagination,
  setPagination,
  loading,
}: PaginatedTableProps<TData, TValue, RowType>) {
  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  const pageCount = Math.ceil(totalRows / pagination.pageSize);

  const table = useReactTable<RowType>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    //getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    getExpandedRowModel: getExpandedRowModel(),
    // getSortedRowModel: getSortedRowModel(),
    onExpandedChange: setExpanded,
    state: {
      expanded,
      pagination,
    },
    onPaginationChange: setPagination,
    pageCount,
  });

  const paginationElement = (
    <TableRow>
      <TableCell colSpan={(table.getRowModel().rows[0]?.getVisibleCells().length ?? 0) + 1}>
        <RealPagination table={table} totalRowCount={totalRows} />
      </TableCell>
    </TableRow>
  );

  return (
    <TableDisplay
      table={table}
      className={className}
      columns={columns}
      data={data}
      direction={direction}
      isAddable={false}
      isTableHeaderHidden={isTableHeaderHidden}
      renderCollapsibleSection={renderCollapsibleSection}
      isTablePaginationVisible
      footer={paginationElement}
      loading={loading}
    />
  );
}
