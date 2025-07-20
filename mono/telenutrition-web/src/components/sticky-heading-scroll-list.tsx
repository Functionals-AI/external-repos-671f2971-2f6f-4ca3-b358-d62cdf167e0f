interface StickyHeadingScrollListGroup<T> {
  label: string;
  items: T[];
}

interface StickyHeadingScrollListProps<T> {
  groups: StickyHeadingScrollListGroup<T>[];
  renderGroupItem: (item: T[]) => JSX.Element;
  EmptyState: () => JSX.Element;
}

export default function StickyHeadingScrollList<T>({
  groups,
  renderGroupItem,
  EmptyState,
}: StickyHeadingScrollListProps<T>) {
  if (!groups.length) return <EmptyState />;

  return (
    <nav className="h-96 overflow-y-scroll px-4" aria-label="List">
      {groups.map((group) => (
        <div key={group.label} className="relative first:pt-0 pt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-lg font-medium text-gray-900">{group.label}</span>
            </div>
          </div>
          {renderGroupItem(group.items)}
        </div>
      ))}
    </nav>
  );
}
