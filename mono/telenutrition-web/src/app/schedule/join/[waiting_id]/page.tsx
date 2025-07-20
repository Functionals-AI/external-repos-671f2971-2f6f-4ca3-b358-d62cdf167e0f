'use client';

import ContainerLoading from '@/ui-components/loading/container-loading';
import BasicLayoutFooter from 'components/layouts/basic/footer';
import useGetAppQueryParam from 'hooks/useGetAppQueryParam';
import FoodsmartLogo from '../../../../../public/logo.svg';
import useFetchMeetingInfo from 'api/useFetchMeetingInfo';
import { useEffect } from 'react';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import GetErrorDislpay from '@/modules/errors/get-error-display';
import { useRouter } from 'next/navigation';
import { AsBasicDate, useDateHelpers } from '@/modules/dates';
import Card from '@/ui-components/card';

export default function PageWrapper() {
  const router = useRouter();
  const waitingIdParamResult = useGetAppQueryParam('waiting_id', 'string');

  if (waitingIdParamResult.loading) {
    return <ContainerLoading />;
  }

  if (!waitingIdParamResult.ok) {
    router.push('/schedule');
    return <ContainerLoading />;
  }

  return <Page waitingId={waitingIdParamResult.value} />;
}
function Page({ waitingId }: { waitingId: string }) {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useFetchMeetingInfo({ waitingId });
  const dateHelpers = useDateHelpers();

  useEffect(() => {
    if (data && data.meetingExternalLink) {
      window.location.href = data.meetingExternalLink;
    }
  }, [data]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <BasicLayout>
        <ContainerLoading />
      </BasicLayout>
    );
  }

  if (error) {
    return (
      <BasicLayout>
        <GetErrorDislpay error={error} refetch={refetch} />
      </BasicLayout>
    );
  }

  const startTimestampDt = DateTime.fromISO(data.startTimestamp);
  const hasMeetingStarted = startTimestampDt < DateTime.now();
  const isMeetingOver = startTimestampDt.plus({ minutes: data.duration }) < DateTime.now();

  const displayText = (() => {
    if (!hasMeetingStarted) {
      return t('Your scheduled session starts at {{startTime}}', {
        startTime: dateHelpers.asTime(startTimestampDt),
      });
    }

    if (isMeetingOver) {
      return t('Your appointment is no longer available');
    }

    return t('A member of the FoodSmart team will join you shortly');
  })();

  return (
    <BasicLayout>
      <div className="flex flex-col gap-4 items-center">
        <p className="text-xl text-neutral-700">{displayText}</p>
        <Card>
          <Card.Row>
            <Card.Row.Label className="w-32 px-4 py-4">Date</Card.Row.Label>
            <Card.Row.Col className="px-4 py-4">
              <AsBasicDate format="full">{startTimestampDt}</AsBasicDate>
            </Card.Row.Col>
          </Card.Row>
          <Card.Row>
            <Card.Row.Label className="w-32 px-4 py-4">Duration</Card.Row.Label>
            <Card.Row.Col className="px-4 py-4">{data.duration} minutes</Card.Row.Col>
          </Card.Row>
        </Card>
      </div>
    </BasicLayout>
  );
}

function BasicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white relative flex flex-col">
      <header className="bg-f-dark-green sticky top-0 w-full z-10 p-4">
        <FoodsmartLogo />
      </header>
      <main className="bg-white pb-8 min-h-full relative flex-1 flex items-center justify-center">
        {children}
      </main>
      <BasicLayoutFooter />
    </div>
  );
}
