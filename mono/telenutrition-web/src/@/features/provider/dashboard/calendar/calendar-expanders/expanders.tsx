import { cn } from '@/utils';
import { useCalendarExpanderContext } from './';
import Icon from '@/ui-components/icons/Icon';

export const calendarItemTimeslotId = (hour: number) => `calendar-item-timeslot-${hour}`;

function ExpanderButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'focusable',
        '-mt-[2px] absolute z-40 ml-10 border border-neutral-150 rounded flex flex-col bg-neutral-100',
        className,
      )}
    >
      <Icon size="sm" name="chevron-down" color="neutral" />
    </button>
  );
}

// At the top of the list
function TopExpander({ className }: { className?: string }) {
  const { isTopExpanded, setIsTopExpanded } = useCalendarExpanderContext();
  if (isTopExpanded) return null;
  return (
    <div className={cn('relative', className)}>
      <ExpanderButton className="rotate-180" onClick={() => setIsTopExpanded(true)} />
    </div>
  );
}

// On a specific item
function TopCollapser({ hour, className }: { hour: number; className?: string }) {
  const { isTopExpanded, isFirstVisibleHour, setIsTopExpanded } = useCalendarExpanderContext();
  if (!isTopExpanded || !isFirstVisibleHour(hour)) return null;
  return (
    <div className={cn('relative', className)}>
      <ExpanderButton className={cn('-mt-2')} onClick={() => setIsTopExpanded(false)} />
    </div>
  );
}

function BottomCollapser({ hour, className }: { hour: number; className?: string }) {
  const { isBottomExpanded, isLastVisibleHour, setIsBottomExpanded } = useCalendarExpanderContext();
  if (!isBottomExpanded || !isLastVisibleHour(hour)) return null;
  return (
    <div className={cn('relative', className)}>
      <ExpanderButton
        className={cn('-mt-2 rotate-180')}
        onClick={() => setIsBottomExpanded(false)}
      />
    </div>
  );
}

function BottomExpander({ className }: { className?: string }) {
  const { isBottomExpanded, setIsBottomExpanded } = useCalendarExpanderContext();
  return (
    <div className={cn('relative', className)}>
      {!isBottomExpanded && (
        <ExpanderButton className="-mt-[22px]" onClick={() => setIsBottomExpanded(true)} />
      )}
    </div>
  );
}

const Expanders = {
  TopExpander,
  TopCollapser,
  BottomExpander,
  BottomCollapser,
};

export default Expanders;
