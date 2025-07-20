import { z } from 'zod';

export const BasePaginationParams = z.object({
  offset: z.coerce.number().min(0, { message: 'Offset must be a positive number' }),
  limit: z.coerce.number().pipe(z.union([z.literal(10), z.literal(25), z.literal(50), z.literal(100)])),
  sortBy: z.enum(['patientName', 'lastSession', 'nextSession']),
  sortOrder: z.enum(['asc', 'desc']),
});

type BasePaginationParams = {
  offset: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
};

export interface PaginationParams {
  offset: number;
  limit: number;
  total: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filters: Record<string, string>;
}

export function buildPaginationMetadata<T extends BasePaginationParams>(
  queryParams: T,
  totalCount: number,
  filterKeys: (keyof T)[],
): PaginationParams {
  const filters = Object.fromEntries(
    filterKeys
      .map((key) => [key, queryParams[key]])
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, Array.isArray(value) ? value.join(',') : String(value)]),
  );

  return {
    offset: queryParams.offset,
    limit: queryParams.limit,
    total: totalCount,
    sortBy: queryParams.sortBy,
    sortOrder: queryParams.sortOrder,
    filters,
  };
}
