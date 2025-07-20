import { getWidgetReactKey } from '@/modules/widgets/helpers';
import type { GroupWidget } from '@mono/telenutrition/lib/types';
import { UseScrollingGroupManagerReturn } from '@/modules/scrolling-group-manager/useScrollingGroupManager';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/ui-components/collapsible';
import Icon from '@/ui-components/icons/Icon';
import { cn } from '@/utils';

function RowItem({
  label,
  className,
  onClick,
  disabled,
  depth,
}: {
  label: string;
  className?: string;
  onClick: () => void;
  disabled?: boolean;
  depth: 0 | 1;
}) {
  return (
    <div
      className={cn('flex items-center gap-x-1 group cursor-pointer', className)}
      onClick={onClick}
    >
      <p
        className={cn(
          'text-neutral-600',
          disabled && '!text-neutral-400',
          depth === 0 ? 'text-xl' : depth === 1 ? 'text-lg' : 'text-base',
        )}
      >
        {label}
      </p>
    </div>
  );
}

export default function StepsNav({
  groups,
  disabled,
  ...scrollingGroupManager
}: {
  groups: { title: string; widgets: { type: 'group' | string }[] }[];
  disabled?: boolean;
} & UseScrollingGroupManagerReturn<any>) {
  return (
    <div className="flex flex-col gap-y-1">
      {groups.map((group) => {
        return (
          <Collapsible key={group.title} className="flex flex-col gap-y-1">
            <CollapsibleTrigger asChild>
              <div
                className={cn('group flex items-center gap-x-2 cursor-pointer')}
                {...(disabled && { inert: '' })}
              >
                <Icon
                  name="chevron-right"
                  className={cn(
                    "rotate-0 group-data-[state='open']:rotate-90 transition-transform cursor-pointer",
                    disabled && '!text-neutral-400',
                  )}
                />
                <RowItem
                  disabled={disabled}
                  depth={0}
                  label={group.title}
                  className="leading-8"
                  onClick={() => {
                    const first = group.widgets.find((w) => w.type === 'group') as GroupWidget;
                    if (first) {
                      scrollingGroupManager.scrollToGroup(first.groupKey);
                    }
                  }}
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="flex gap-x-2">
              <div className="px-3 py-1">
                <div className="w-[1px] h-full bg-gray-400" />
              </div>
              <div className="flex flex-col gap-y-1">
                {(group.widgets.filter((w) => w.type === 'group') as GroupWidget[]).map(
                  (groupWidget) => {
                    return (
                      <RowItem
                        disabled={disabled}
                        depth={1}
                        key={getWidgetReactKey(groupWidget)}
                        label={groupWidget.title}
                        className="leading-6"
                        onClick={() => scrollingGroupManager.scrollToGroup(groupWidget.groupKey)}
                      />
                    );
                  },
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
