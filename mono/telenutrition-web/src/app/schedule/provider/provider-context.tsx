'use client';

import { FetchProviderMeResult, useFetchProviderMe } from 'api/provider/useFetchProviderMe';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, createContext, useContext } from 'react';
import { DeveloperError } from 'utils/errors';
import usePostLogout from 'api/auth/usePostLogout';
import useToaster from 'hooks/useToaster';
import ContainerLoading from '@/ui-components/loading/container-loading';

interface IProviderContext {
  providerData: FetchProviderMeResult;
  logout: () => void;
}

const ProviderContext = createContext<IProviderContext | null>(null);

function useProviderContext() {
  const context = useContext(ProviderContext);
  if (!context) throw new DeveloperError('ProviderContext.Provider needed');

  return context;
}

export function ProviderContextProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, error, isLoading } = useFetchProviderMe();
  const { post: postLogout } = usePostLogout();
  const toaster = useToaster();

  function logout() {
    postLogout({ payload: {} })
      .then(() => {
        window.location.href = '/schedule/provider/login';
      })
      .catch((error) => {
        toaster.apiError({ error, title: 'Error logging out' });
      });
  }

  if (isLoading) return <ContainerLoading />;
  if (error) {
    if (pathname === '/schedule/provider/login') return <>{children}</>;

    router.push('/schedule/provider/login');
    return <ContainerLoading />;
  }

  return (
    <ProviderContext.Provider value={{ providerData: data, logout }}>
      {children}
    </ProviderContext.Provider>
  );
}

export { ProviderContext, useProviderContext };
