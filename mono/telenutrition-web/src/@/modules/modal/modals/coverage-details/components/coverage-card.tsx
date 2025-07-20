import { useTranslation } from 'react-i18next';

import { PatientPaymentMethod } from 'api/types';
import DataCard, { DataValue } from '@/ui-components/data-card';
import Icon from '@/ui-components/icons/Icon';

export default function CoverageCard({
  paymentMethod,
  isFollowUp,
  dataTestId,
}: {
  paymentMethod: PatientPaymentMethod;
  isFollowUp?: boolean;
  dataTestId?: string;
}) {
  const { t } = useTranslation();

  const canScheduleAudioOnly = paymentMethod.type.audioSupport !== 'never';

  const data: DataValue[] = [
    {
      type: 'data',
      label: t('Visit length'),
      value: t('{{minutes}} minutes', {
        minutes: isFollowUp ? paymentMethod.type.followUpDurations[0] : 60,
      }),
      dataTestId: 'visit-length',
    },
    {
      type: 'header',
      label: t('Visit limitations'),
    },
    {
      type: 'data',
      label: t('Video visits'),
      value: <Icon name="check" color="fsGreen" />,
      dataTestId: 'video-visits',
    },
    {
      type: 'data',
      label: t('Audio visits'),
      value: canScheduleAudioOnly ? <Icon name="check" color="fsGreen" /> : null,
      dataTestId: 'audio-visits',
    },
    {
      type: 'header',
      label: t('Medical requirements'),
    },
    {
      type: 'data',
      label: t('MD Oversight'),
      value: paymentMethod.oversightRequired ? <Icon name="check" color="fsGreen" /> : null,
      dataTestId: 'medical-oversight',
    },
  ];

  return <DataCard data={data} dataTestId={dataTestId} />;
}
