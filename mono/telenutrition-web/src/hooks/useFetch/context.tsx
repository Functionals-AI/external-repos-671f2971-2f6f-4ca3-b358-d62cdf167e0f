'use client';

import { createContext, useCallback, useContext, useState } from 'react';

export type QueryKey = (string | number)[];

type UseFetchCache = Record<string, { data: unknown; expireTime?: number }>;

type UseFetchCacheContextType = {
  getCacheValue: <Data>(queryKey: QueryKey) => Data | null;
  updateCache: (queryKey: QueryKey, data: unknown, options?: UpdateOptions) => void;
  cache: UseFetchCache;
  invalidateCacheKey: (queryKey: QueryKey) => void;
  invalidateAllCache: () => void;
};

export const UseFetchCacheContext = createContext<UseFetchCacheContextType | null>(null);

function getCacheKey(queryKey: QueryKey) {
  return queryKey.join('_');
}

interface UpdateOptions {
  ttl?: number;
}

export function UseFetchCacheProvider({ children }: { children: React.ReactNode }) {
  const [cache, setCache] = useState<UseFetchCache>({});

  function updateCache(queryKey: QueryKey, data: any, options?: UpdateOptions) {
    setCache((prevCache) => ({
      ...prevCache,
      [getCacheKey(queryKey)]: {
        data,
        expireTime: options?.ttl ? Date.now() + options.ttl : undefined,
      },
    }));
  }

  function getCacheValue<Data>(queryKey: QueryKey): Data | null {
    const cacheValue = cache[getCacheKey(queryKey)];
    if (!cacheValue) return null;
    if (cacheValue.expireTime && Date.now() > cacheValue.expireTime) {
      invalidateCacheKey(queryKey);
      return null;
    }
    return cacheValue.data as Data;
  }

  // If given ['provider', 'patients'] query key to invalidate, it should invalidate all
  // keys that match exactly to this, OR start with this.

  const invalidateCacheKey = useCallback((queryKey: QueryKey) => {
    const cacheKey = getCacheKey(queryKey);

    setCache((prevCache) => {
      const updatedCache: UseFetchCache = Object.entries(prevCache).reduce((acc, [key, value]) => {
        if (key.startsWith(cacheKey)) {
          return acc;
        } else return { ...acc, [key]: value };
      }, {});

      return updatedCache;
    });
  }, []);

  function invalidateAllCache() {
    setCache({});
  }

  return (
    <UseFetchCacheContext.Provider
      value={{ updateCache, getCacheValue, cache, invalidateCacheKey, invalidateAllCache }}
    >
      {children}
    </UseFetchCacheContext.Provider>
  );
}

export function useFetchCache() {
  const context = useContext(UseFetchCacheContext);
  if (!context) {
    throw new Error('useFetchCache must be used within a UseFetchCacheProvider');
  }
  return context;
}
