import * as React from 'react';

import {
  ColumnDef,
  ExpandedState,
  Row,
  SortingState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui-components/table';
import Card from '@/ui-components/card';
import { Button } from '@/ui-components/button';
import { PlusIcon } from 'lucide-react';

import * as Collapsible from '@radix-ui/react-collapsible';

import { cn } from '@/utils';
import { DataTablePagination } from '../components/data-table-pagination';
import Icon from '@/ui-components/icons/Icon';

const MIN_PAGE_SIZE = 10;

export type SingleRowData<TData> = {
  type: 'single';
  data: TData;
};

export type NestedRowData<TData> = {
  type: 'nested';
  subRows: SingleRowData<TData>[];
};

export type RowData<TData> = SingleRowData<TData> | NestedRowData<TData>;

interface GenericTableProps<TData, TValue, RowType extends RowData<TData>> {
  className?: string;
  columns: ColumnDef<RowType, TValue>[];
  data: RowType[];
  direction?: 'horizontal' | 'vertical';
  isAddable?: boolean;
  isTableHeaderHidden?: boolean;
  isTablePaginationVisible?: boolean;
  renderCollapsibleSection?: (item: RowType) => React.ReactNode;
  defaultSortingState?: SortingState;
}

export default function GenericTable<TData, TValue, RowType extends RowData<TData>>({
  className,
  columns,
  data,
  direction,
  isAddable,
  isTableHeaderHidden,
  isTablePaginationVisible,
  renderCollapsibleSection,
  defaultSortingState,
}: GenericTableProps<TData, TValue, RowType>) {
  const [sorting, setSorting] = React.useState<SortingState>(() => defaultSortingState || []);
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const table = useReactTable<RowType>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getSubRows: (row) => (row.type === 'nested' ? (row.subRows as RowType[]) : undefined),
    onExpandedChange: setExpanded,
    state: {
      sorting,
      expanded,
    },
  });

  const headerGroup = table.getHeaderGroups()[0];

  const cells = table
    .getRowModel()
    .rows.map((row) =>
      row
        .getVisibleCells()
        .map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        )),
    );

  const hasCollapsibleSection = !!renderCollapsibleSection;

  const isPaginationVisible =
    isTablePaginationVisible && table.getFilteredRowModel().rows.length >= MIN_PAGE_SIZE;

  if (direction === 'horizontal')
    return (
      <Card className={cn(className)}>
        <Table data-testid={'data-table'}>
          <TableBody>
            {headerGroup.headers.map((header, j) => (
              <TableRow key={header.id}>
                {!isTableHeaderHidden && (
                  <TableHead className="bg-neutral-100">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                )}
                {new Array(table.getRowModel().rows.length).fill(0).map((_, i) => cells[i][j])}
              </TableRow>
            ))}
            {isAddable && (
              <TableRow key="add-row">
                <TableHead className="bg-neutral-100">
                  <Button variant="tertiary" size="sm" className="ml-4">
                    <PlusIcon size={16} /> Add
                  </Button>
                </TableHead>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    );

  const rows = table.getRowModel().rows;

  return (
    <Card className={cn(className)}>
      <Table data-testid="data-table">
        {!isTableHeaderHidden && (
          <TableHeader className="bg-neutral-115">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {hasCollapsibleSection && <TableHead className="w-8" key={'expansion'}></TableHead>}
                {headerGroup.headers.map((header, ind) => {
                  return (
                    <TableHead
                      className={cn(
                        'text-base text-neutral-700',
                        !hasCollapsibleSection && ind === 0 && 'pl-4',
                      )}
                      key={header.id}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
                {isAddable && (
                  <TableHead className="text-right justify-end" align="right">
                    <Button variant="tertiary" size="sm" className="ml-4">
                      <PlusIcon size={16} /> Add
                    </Button>
                  </TableHead>
                )}
              </TableRow>
            ))}
          </TableHeader>
        )}
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={hasCollapsibleSection ? columns.length + 1 : columns.length}
                className="h-24 text-center"
              >
                No results
              </TableCell>
            </TableRow>
          ) : (
            <>
              {rows.map((row, i) => {
                const parentRow = row.getParentRow();
                const isParentExpanded = parentRow && parentRow.getIsExpanded();
                const isRowLastSubRowInExpandedParentRow =
                  isParentExpanded && row.index === parentRow.subRows.length - 1;

                const classNames = (() => {
                  const classNames = [];
                  if (row.depth === 0 && row.original.type === 'nested') {
                    classNames.push(row.getIsExpanded() && 'bg-fs-pale-green-100');
                  } else {
                    if (isParentExpanded) {
                      if (isRowLastSubRowInExpandedParentRow) {
                        if (!(expanded as any)[row.id]) {
                          classNames.push('!border-b-8 border-b-fs-pale-green-100 transition-none');
                        }
                      }
                      if (row.index === 0) {
                        // classNames.push('border-t-8 border-t-fs-pale-green-100');
                      }
                    }
                  }

                  return classNames;
                })();

                const visibleCells = row.getVisibleCells();

                return (
                  <React.Fragment
                    key={row.id}
                  >
                    <TableRow
                      className={cn(classNames, row.getIsExpanded() && 'border-b-0')}
                      data-testid="data-table-row"
                      data-test={`data-table-row-depth-${row.depth}`}
                      data-state={row.getIsSelected() && 'selected'}
                    >
                      {row.original.type === 'single' && hasCollapsibleSection && (
                        <ExpanderButtonCell
                          row={row}
                          onClick={() =>
                            setExpanded((prev) =>
                              typeof prev === 'boolean'
                                ? { [row.id]: true }
                                : { ...prev, [row.id]: !prev[row.id] },
                            )
                          }
                        />
                      )}
                      {row.original.type === 'nested' && (
                        <ExpanderButtonCell row={row} onClick={row.getToggleExpandedHandler()} />
                      )}
                      {visibleCells.map((cell, ind) => {
                        const classNames = [];
                        if (row.depth === 1) {
                          const parentRow = row.getParentRow();
                          if (parentRow && parentRow.getIsExpanded()) {
                            if (ind === visibleCells.length - 1) {
                              classNames.push(
                                'after:absolute after:bg-fs-pale-green-100 after:h-[105%] after:w-2 after:content-[""] after:right-[-1px] after:top-[-1px]',
                              );
                            }
                          }
                        }
                        return (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              'relative',
                              !hasCollapsibleSection &&
                                row.original.type !== 'nested' &&
                                ind === 0 &&
                                'pl-4',
                            )}
                          >
                            <div className={cn(classNames)}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    {(expanded as any)[row.id] && row.original.type === 'single' && (
                      <TableRow
                        className={cn(
                          'relative',
                          'border-b-0',
                          isRowLastSubRowInExpandedParentRow &&
                            'border-b-8 border-b-fs-pale-green-100',
                        )}
                      >
                        <TableCell
                          colSpan={row.getVisibleCells().length + 1}
                          className={cn(
                            row.getParentRow()?.original.type === 'nested' &&
                              'before:absolute before:bg-fs-pale-green-100 before:h-[102%] before:w-2 before:content-[""] before:left-[-1px] before:top-[-1px]',
                            row.getParentRow()?.original.type === 'nested' &&
                              'after:absolute after:bg-fs-pale-green-100 after:h-[102%] after:w-2 after:content-[""] after:right-[-1px] after:top-[-1px]',
                          )}
                        >
                          <Collapsible.Root open className="overflow-x-visible">
                            <Collapsible.Content
                              className={cn(
                                'px-3',
                                'before:content-[""] before:h-full before:w-1 before:absolute before:top-0 before:bg-fs-green-300',
                                'border-b-2 border-b-fs-green-300 -mb-[1px] w-full',
                                row.getParentRow()?.original.type === 'nested'
                                  ? 'before:left-[7px]'
                                  : 'before:left-[0px]',
                                isRowLastSubRowInExpandedParentRow && '!mb-[1px]',
                              )}
                            >
                              {renderCollapsibleSection && renderCollapsibleSection(row.original)}
                            </Collapsible.Content>
                          </Collapsible.Root>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
              {isPaginationVisible && (
                <TableRow>
                  <TableCell colSpan={table.getRowModel().rows[0].getVisibleCells().length + 1}>
                    <DataTablePagination table={table} />
                  </TableCell>
                </TableRow>
              )}
            </>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

function ExpanderButtonCell({ onClick, row }: { onClick: () => void; row: Row<RowData<unknown>> }) {
  const isExpanded = row.getIsExpanded();

  const addLeftBorder = row.depth > 0 && row.getIsAllParentsExpanded();

  return (
    <TableCell
      className={cn(
        'relative h-full',
        row.original.type === 'single' &&
          row.getIsExpanded() &&
          'before:content-[""] before:h-full before:w-1 before:absolute before:top-0 before:bg-fs-green-300',
        row.getParentRow()?.original.type === 'nested' ? 'before:left-[7px]' : 'before:left-[0px]',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center px-2',
          addLeftBorder &&
            'before:absolute before:bg-fs-pale-green-100 before:h-[105%] before:w-2 before:content-[""] before:left-[-1px] before:top-[-1px]',
        )}
      >
        <Button
          dataTestId="table-expander-button"
          className="ml-2"
          size="sm"
          variant="tertiary"
          onClick={onClick}
        >
          <Icon
            name="chevron-right"
            size="sm"
            color="neutral"
            className={cn('transition-transform', isExpanded && 'rotate-90')}
          />
        </Button>
      </div>
    </TableCell>
  );
}
