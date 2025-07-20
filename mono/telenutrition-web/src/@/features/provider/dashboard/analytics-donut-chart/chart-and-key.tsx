import { Badge } from '@/ui-components/badge';
import PieDonutChart, { DataItem } from '@garvae/react-pie-donut-chart';
import { AppointmentAnalyticsRecord } from 'api/provider/useFetchProviderSchedulingAnalytics';

type Data = AppointmentAnalyticsRecord[];

export default function ChartAndKey({ data }: { data: Data }) {
  const chartData: (DataItem & {
    label: string;
    theme: 'statusGreen' | 'blue' | 'pale-green' | 'statusAmber' | 'statusRed' | 'neutral';
  })[] = data.map(({ value, theme, label }) => ({
    value: value,
    theme: theme,
    label: label,
    color:
      theme === 'blue'
        ? 'var(--blue-200)'
        : theme === 'neutral'
        ? 'var(--neutral-115)'
        : theme === 'pale-green'
        ? 'var(--fs-pale-green-100)'
        : theme === 'statusAmber'
        ? 'var(--status-amber-150)'
        : theme === 'statusGreen'
        ? 'var(--status-green-400)'
        : theme === 'statusRed'
        ? 'var(--status-red-400)'
        : 'var(--neutral-115)',
  }));

  return (
    <div className="flex gap-x-2 items-center">
      <PieDonutChart
        size={100}
        donutThickness={8}
        data={chartData}
        text={' '}
        isScaleOnHover={false}
        isSelectOnClick={false}
        isSelectOnKeyEnterDown={false}
        isSelectedValueShownInCenter={false}
        hoverScaleRatio={1}
        classNames={{
          chartSegment: '!cursor-default',
        }}
      />
      <div className="flex flex-col gap-y-2">
        {chartData.map((d) => {
          return (
            <div key={d.label} className="flex gap-x-3">
              <Badge
                className="w-8 items-center justify-center"
                variant={
                  d.theme === 'blue'
                    ? 'blue'
                    : d.theme === 'neutral'
                    ? 'neutral'
                    : d.theme === 'pale-green'
                    ? 'paleGreen'
                    : d.theme === 'statusAmber'
                    ? 'statusAmber'
                    : d.theme === 'statusGreen'
                    ? 'statusGreen'
                    : d.theme === 'statusRed'
                    ? 'statusRed'
                    : 'neutral'
                }
              >
                {d.value}
              </Badge>
              <p className="flex-1">{d.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
