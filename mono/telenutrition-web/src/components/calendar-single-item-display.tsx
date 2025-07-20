interface StickyHeadingScrollListGroup<T> {
  label: string;
  items: T[];
}

interface StickyHeadingScrollListProps<T> {
  groups: StickyHeadingScrollListGroup<T>[];
  renderGroupItem: (item: T[]) => JSX.Element;
  EmptyState: () => JSX.Element;
}

export default function CalendarSingleItemDisplay<T>({
  groups,
  renderGroupItem,
  EmptyState,
}: StickyHeadingScrollListProps<T>) {
  if (!groups.length) return <EmptyState />;

  const firstGroup = groups[0];
  return (
    <div className="overflow-y-scroll px-4">
      <div key={firstGroup.label} className="relative first:pt-0 pt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-gray-200 text-lg font-medium text-gray-900">
              {firstGroup.label}
            </span>
          </div>
        </div>
        {renderGroupItem(firstGroup.items)}
      </div>
    </div>
  );
}
