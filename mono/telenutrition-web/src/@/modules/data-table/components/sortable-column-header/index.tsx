import { Column } from '@tanstack/react-table';
import { cn } from '@/utils';
import { Button } from '@/ui-components/button';
import Icon from '@/ui-components/icons/Icon';

export const SortableColumnHeader = ({
  column,
  children,
  direction,
}: {
  column: Column<any, unknown>;
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
}) => {
  const isSorted = column.getIsSorted();

  return (
    <div className="flex flex-row items-center group font-normal">
      {children}
      {/* <Button
        className={cn(
          'min-w-0 ml-2 flex justify-center items-center invisible group-hover:visible',
          isSorted ? 'text-fs-green-300 visible' : 'text-neutral-400',
        )}
        variant="tertiary"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        {direction === 'horizontal' ? (
          <ArrowLeftRight className="h-4 w-4" />
        ) : (
          <RightArrow className={cn('h-4 w-4', isSorted === 'asc' ? '-rotate-90' : 'rotate-90')} />
        )}
      </Button> */}
    </div>
  );
};

export function SortableWorkingColumnHeader({
  column,
  children,
}: {
  column: Column<any, unknown>;
  children: React.ReactNode;
}) {
  const isSorted = column.getIsSorted();

  return (
    <div className="flex flex-row items-center group font-normal">
      {children}
      <Button
        className={cn(
          'min-w-0 ml-2 flex justify-center items-center invisible group-hover:visible',
          isSorted ? 'text-fs-green-300 visible' : 'text-neutral-400',
        )}
        variant="tertiary"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        <Icon size="xs" name={isSorted === 'asc' ? 'arrow-up' : 'arrow-down'} />
      </Button>
    </div>
  );
}

const SortableColumnHeaderExports = {
  SortableColumnHeader,
  SortableWorkingColumnHeader,
}

export default SortableColumnHeader;
