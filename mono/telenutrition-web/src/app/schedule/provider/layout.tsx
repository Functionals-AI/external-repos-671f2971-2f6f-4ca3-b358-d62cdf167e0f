import { ReactNode } from 'react';
import { ProviderContextProvider } from './provider-context';
import UseProviderTimezone from 'route-guards/use-provider-timezone';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <ProviderContextProvider>
      <UseProviderTimezone />
      {children}
    </ProviderContextProvider>
  );
}
