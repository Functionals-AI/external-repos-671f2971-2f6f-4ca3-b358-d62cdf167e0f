import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/router';
import Button from '../../components/button';
import AvocadoLgIcon from '../../../public/avocado-lg.svg';
import DashboardLayout from './layout';
import UpcomingAppointments from './upcoming-appointments';
import { Trans, useTranslation } from 'react-i18next';
import useAppUser from '../../hooks/useAppUser';
import Loading from '../../components/loading';
import RewardsEarned from './rewards-earned';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/ui-components/tabs';
import PastVisits from './past-visits';

enum DashboardTabs {
  Upcoming = 'Upcoming',
  Past = 'Past',
}

export default function Dashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const [name, setName] = useState<string | null>(null);
  const appUserResult = useAppUser({ required: true });

  useEffect(() => {
    if (appUserResult.data?.firstName && appUserResult.data?.lastName) {
      setName(`${appUserResult.data.firstName} ${appUserResult.data.lastName}`);
    }
  }, [appUserResult.data]);

  if (appUserResult.loading) {
    return (
      <DashboardLayout>
        <Loading />
      </DashboardLayout>
    );
  }

  const handleScheduleAppointment = () => {
    router.push('/schedule/flow/select-patient');
  };

  return (
    <DashboardLayout>
      <div className="flex w-full flex-col 2xl:flex-row xl:pb-8">
        <div className="flex justify-center 2xl:justify-start py-8 h-max" style={{ flex: 1 }}>
          <div className="mr-8 hidden sm:block">
            <AvocadoLgIcon />
          </div>
          <div className="flex flex-col justify-center gap-y-4 w-full max-w-xs xl:max-w-md px-8">
            <div className="flex justify-center ">
              <h2 className="text-f-very-dark-green text-4xl sm:text-5xl xl:text-7xl">
                {t('Hello', 'Hello')}
              </h2>
            </div>
            <div className="flex justify-center  ">
              <h2 className="text-f-light-green text-4xl sm:text-5xl xl:text-5xl">{name}!</h2>
            </div>
          </div>
        </div>
        <div className="flex flex-col" style={{ flex: 1 }}>
          <RewardsEarned />
          <Tabs defaultValue={DashboardTabs.Upcoming}>
            <TabsList>
              <TabsTrigger value={DashboardTabs.Upcoming}>
                <Trans>Upcoming Appointments</Trans>
              </TabsTrigger>
              <TabsTrigger value={DashboardTabs.Past}>
                <Trans>Past Visits</Trans>
              </TabsTrigger>
            </TabsList>
            <TabsContent value={DashboardTabs.Upcoming}>
              <UpcomingAppointments />
              <div>
                <div className="rounded-md bg-white border border-neutral-150 flex flex-col sm:flex-row gap-y-4 justify-between py-5 px-10 items-center">
                  <p className="text-m font-light">
                    {t(
                      'ToScheduleAnotherAppointment',
                      'To schedule another appointment, simply click the “Schedule” button',
                    )}
                  </p>
                  <Button
                    className="font-bold text-xl w-32 lg:w-32 2xl:w-32"
                    size="large"
                    variant="primary"
                    onClick={handleScheduleAppointment}
                  >
                    {t('Schedule', 'Schedule')}
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value={DashboardTabs.Past}>
              <PastVisits />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {appUserResult.data.hasSSO && (
        <>
          <div className="mt-8">
            <div className="rounded-md bg-white border border-neutral-150 flex flex-col sm:flex-row gap-y-4 justify-between py-5 px-10 items-center">
              <p className="text-xl font-light">
                {t(
                  'ToTakeNutriQuiz',
                  'Boost your wellbeing by filling this survey, paving the way for a personalized nutrition program tailored to your health goals.',
                )}
              </p>
              <a
                href={`/schedule/foodapp?path=${encodeURIComponent('/survey/complete-nutriquiz')}`}
                target="_blank"
              >
                <Button
                  className="font-bold text-xl w-32 lg:w-40 2xl:w-80"
                  size="large"
                  variant="secondary"
                >
                  {t('StartNutriQuiz', 'Start NutriQuiz')}
                </Button>
              </a>
            </div>
          </div>
          <div className="mt-8">
            <div className="rounded-md bg-white flex flex-col sm:flex-row gap-y-4 justify-between py-5 px-10 items-center">
              <p className="text-xl font-light">
                {t(
                  'ToBrowseHealthyRecipes',
                  'Interested in tasty and healthy meals? Click here to explore our simple, delicious recipes!',
                )}
              </p>
              <a href="/schedule/foodapp" target="_blank">
                <Button
                  className="font-bold text-xl w-32 lg:w-40 2xl:w-80"
                  size="large"
                  variant="secondary"
                >
                  {t('BrowseRecipes', 'Browse Recipes')}
                </Button>
              </a>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
