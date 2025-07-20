import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui-components/form/select';
import { SplitButton, SplitButtonItem } from '@/ui-components/button/split';
import Icon from '@/ui-components/icons/Icon';
import { Table as TableType } from '@tanstack/react-table';

import { RowData } from '../../generic-table/table-display';
import { cn } from '@/utils';

interface Props<TData, RowType extends RowData<TData>> {
  table: TableType<RowType>;
  totalRowCount: number;
}

export function RealPagination<TData, RowType extends RowData<TData>>({
  table,
  totalRowCount,
}: Props<TData, RowType>) {
  const pageIndex = table.getState().pagination.pageIndex;
  const displayStartIndex =
    table.getState().pagination.pageSize * table.getState().pagination.pageIndex + 1;
  const displayEndIndex = Math.min(
    table.getState().pagination.pageSize * (table.getState().pagination.pageIndex + 1),
    totalRowCount,
  );
  const pageStartInd = Math.max(0, pageIndex - 2);
  const pageEndInd = Math.min(
    Math.ceil(totalRowCount / table.getState().pagination.pageSize) - 1,
    pageIndex + 2,
  );
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        <h5 className='ml-1'>
          <span className="font-bold">
            {displayStartIndex}-{displayEndIndex}
          </span>
          {' of '}
          <span className="font-bold">{totalRowCount} members</span>
        </h5>
      </div>
      <div className="flex items-center space-x-8">
        <SplitButton variant="primary" size="default" theme="primary">
          <SplitButtonItem
            className={cn('px-2', !table.getCanPreviousPage() && 'bg-neutral-100 text-neutral-700')}
            variant="secondary"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <Icon name="chevron-left" color="neutral" />
          </SplitButtonItem>
          {new Array(pageEndInd - pageStartInd + 1).fill(0).map((_, ind) => (
            <SplitButtonItem
              key={pageStartInd + ind}
              className={cn(
                'min-w-[2rem]',
                pageStartInd + ind === pageIndex &&
                  'bg-fs-green-300 text-white active:bg-fs-green-300 focus:bg-fs-green-300 active:text-white focus:text-white hover:bg-fs-green-200',
              )}
              variant={'secondary'}
              onClick={() => table.setPageIndex(pageStartInd + ind)}
            >
              <span className="sr-only">Go to {pageStartInd + ind + 1}th page</span>
              {pageStartInd + ind + 1}
            </SplitButtonItem>
          ))}
          <SplitButtonItem
            className={cn('px-2', !table.getCanNextPage() && 'bg-neutral-100 text-neutral-700')}
            variant="secondary"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <Icon name="chevron-right" color="neutral" />
          </SplitButtonItem>
        </SplitButton>
        <div className="flex items-center space-x-2">
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {[10, 25, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize} per page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
