import { useState } from 'react';
import ButtonToggle from '@/ui-components/form/button-toggle';
import ThisWeekAnalyticsDonut from './this-week';
import TodayAnalyticsDonut from './today';
import Icon from '@/ui-components/icons/Icon';
import { Trans, useTranslation } from 'react-i18next';

enum DisplayType {
  Today = 'TODAY',
  ThisWeek = 'THIS_WEEK',
}

interface DoughnutChartProps {}

export default function AnalyticsDoughnutChart({}: DoughnutChartProps) {
  const { t } = useTranslation();
  const [display, setDisplay] = useState<DisplayType>(DisplayType.Today);

  return (
    <div className="flex flex-col gap-y-4">
      <h4 className="text-lg font-semibold py-2">
        <Trans>Availability breakdown</Trans>
      </h4>
      <ButtonToggle
        className="w-full h-8"
        value={display}
        onChange={(v) => setDisplay(v as DisplayType)}
        options={[
          {
            value: DisplayType.Today,
            name: t('Today'),
            iconName: 'calendar-arrow',
          },
          {
            value: DisplayType.ThisWeek,
            name: t('This week'),
            iconName: 'calendar-week',
          },
        ]}
      />
      {display === DisplayType.Today ? <TodayAnalyticsDonut /> : <ThisWeekAnalyticsDonut />}
    </div>
  );
}
