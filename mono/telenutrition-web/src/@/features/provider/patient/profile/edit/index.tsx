'use client';

import React from 'react';
import { PatientProfile } from '../util';
import { useRouter } from 'next/navigation';
import { useFetchProviderPatientById } from 'api/provider/useGetProviderPatient';
import usePutProviderPatient from 'api/provider/usePutProviderPatient';
import InfoForm from './info-form';
import useToaster from 'hooks/useToaster';
import { useTranslation } from 'react-i18next';
import GetErrorDislpay from '@/modules/errors/get-error-display';
import _ from 'lodash';

function getKeyValueObj(key: string, values: PatientProfile) {
  if (!(key in values)) {
    return {};
  }

  const value = _.get(values, key) as string;

  if (value === undefined) {
    return {};
  }
  if (value === null || value === '') {
    return { [key]: null };
  }
  return { [key]: value };
}

export default function ProfileEdit({ patientId }: { patientId: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { isLoading, error, data, refetch } = useFetchProviderPatientById({ patientId });
  const { post: putProviderPatient } = usePutProviderPatient();
  const toast = useToaster();

  if (isLoading) {
    return <div>{t('Loading...')}</div>;
  }
  if (error) return <GetErrorDislpay refetch={refetch} error={error} />;

  const onSubmit = async (values: PatientProfile) => {
    putProviderPatient({
      payload: {
        patientId,
        patient: {
          ...values,
          ...getKeyValueObj('phone', values),
          ...getKeyValueObj('email', values),
        },
      },
    })
      .then(async () => {
        router.push(`/schedule/provider/patient/${patientId}/profile/view`);
        toast.success({
          title: t('Successfully updated!'),
          message: t('Member information has been updated successfully!'),
        });
      })
      .catch((e) => {
        toast.apiError({ title: t('Failed to update member'), error: e });
      });
  };

  return <InfoForm patient={data.patient} onSubmit={onSubmit} />;
}
