import { Table } from '@tanstack/react-table';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui-components/form/select';
import { SplitButton, SplitButtonItem } from '@/ui-components/button/split';
import Icon from '@/ui-components/icons/Icon';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
  const pageIndex = table.getState().pagination.pageIndex;
  const totalRowCount = table.getFilteredRowModel().rows.length;
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
        <h5>
          {displayStartIndex}~{displayEndIndex} of {totalRowCount} entries
        </h5>
      </div>
      <div className="flex items-center space-x-8">
        <SplitButton variant="primary" size="default" theme="primary">
          <SplitButtonItem
            className="px-2"
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
              className="min-w-[2rem]"
              variant={pageStartInd + ind === pageIndex ? 'primary' : 'secondary'}
              onClick={() => table.setPageIndex(pageStartInd + ind)}
            >
              <span className="sr-only">Go to {pageStartInd + ind + 1}th page</span>
              {pageStartInd + ind + 1}
            </SplitButtonItem>
          ))}
          <SplitButtonItem
            className="px-2"
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
            <SelectContent side="top" className="bg-white">
              {[10, 25, 50, 100].map((pageSize) => (
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
