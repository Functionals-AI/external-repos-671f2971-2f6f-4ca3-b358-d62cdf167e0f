export function groupBy<T>(
  list: T[],
  keyGetter: (item: T) => string | number,
): Map<number | string, T[]> {
  const map = new Map();
  list.forEach((item) => {
    const key = keyGetter(item);
    const collection = map.get(key);
    if (!collection) {
      map.set(key, [item]);
    } else {
      collection.push(item);
    }
  });
  return map;
}

export type GroupByAndSortReturn<T> = { key: string; arr: T[] }[];

export function groupByAndSort<T>(
  list: T[],
  keyGetter: (item: T) => string | number,
  sortFn: (item1: { key: string; arr: T[] }, item2: { key: string; arr: T[] }) => number,
): GroupByAndSortReturn<T> {
  const groupedBy = groupBy(list, keyGetter);
  return Array.from(groupedBy.entries())
    .map(([key, values]) => ({
      key: String(key),
      arr: values,
    }))
    .sort(sortFn);
}
