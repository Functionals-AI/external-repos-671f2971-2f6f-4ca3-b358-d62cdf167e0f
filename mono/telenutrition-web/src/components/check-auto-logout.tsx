import React from 'react';
import useCheckAutoLogout from '../hooks/useCheckAutoLogout';
import Loading from './loading';

export default function CheckAutoLogout({ children }: { children: React.ReactNode }) {
  const done = useCheckAutoLogout();
  return done ? <>{children}</> : <Loading />;
}
