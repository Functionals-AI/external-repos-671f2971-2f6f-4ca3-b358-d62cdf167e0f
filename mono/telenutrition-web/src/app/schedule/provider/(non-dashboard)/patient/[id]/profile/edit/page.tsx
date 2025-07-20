'use client';

import React from 'react';
import ProfileEdit from '@/features/provider/patient/profile/edit';
import { useRouter } from 'next/navigation';
import useGetAppQueryParam from 'hooks/useGetAppQueryParam';

export default function Page() {
  const router = useRouter();
  const patientIdResult = useGetAppQueryParam('id', 'number');

  if (patientIdResult.loading) {
    return <div>Loading...</div>;
  }

  if (!patientIdResult.ok) {
    router.push('/schedule/provider/profile');
    return <div>Loading...</div>;
  }

  return <ProfileEdit patientId={patientIdResult.value} />;
}
