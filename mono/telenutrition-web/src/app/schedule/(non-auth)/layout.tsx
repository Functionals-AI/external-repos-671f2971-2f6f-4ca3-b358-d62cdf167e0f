'use client';

import TempAppStateWrapper from 'app/temp-app-state-wrapper';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TempAppStateWrapper requireAuth={false}>{children}</TempAppStateWrapper>
    </>
  );
}
