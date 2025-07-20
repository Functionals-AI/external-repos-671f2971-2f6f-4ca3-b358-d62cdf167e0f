import {
  FetchProviderPerformanceMetricsResult,
  ProviderMetricsDateRangeType,
} from 'api/provider/useFetchProviderPerformanceMetrics';
import { DateTime } from 'luxon';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const DATE_FORMAT = 'yyyy-LL-dd';

function getChartData({
  dateRangeType,
  chartData,
}: {
  dateRangeType: ProviderMetricsDateRangeType;
  chartData: FetchProviderPerformanceMetricsResult;
}) {
  const data: UnitsBilledChartData[] = [];
  let startDate =
    dateRangeType === ProviderMetricsDateRangeType.Today
      ? DateTime.fromFormat(chartData.startDate, DATE_FORMAT).startOf('week')
      : DateTime.fromFormat(chartData.startDate, DATE_FORMAT);
  const endDate = DateTime.fromFormat(chartData.endDate, DATE_FORMAT);
  while (startDate <= endDate) {
    const foundUnitsBilledForDay = chartData.unitsBilledByDay.find(
      (item) => item.appointmentDate === startDate.toFormat(DATE_FORMAT),
    );

    const dateString = (() => {
      switch (dateRangeType) {
        case ProviderMetricsDateRangeType.WeekToDate:
        case ProviderMetricsDateRangeType.Today:
          return startDate.toFormat('LL/d');
        case ProviderMetricsDateRangeType.MonthToDate:
        case ProviderMetricsDateRangeType.LastMonth:
          return startDate.toFormat('d');
        case ProviderMetricsDateRangeType.Custom:
          return startDate.toFormat('LL/d');
        default:
          return startDate.toFormat('d');
      }
    })();

    data.push({
      dateString: dateString,
      day: startDate.day,
      longDateString: startDate.toFormat('L/d'),
      unitsBilled: foundUnitsBilledForDay?.unitsBilled ?? 0,
    });
    startDate = startDate.plus({ days: 1 });
  }

  return data;
}

interface UnitsBilledChartData {
  dateString: string;
  unitsBilled: number;
  longDateString: string;
  day: number;
}

export default function UnitsBilledChart({
  chartData,
  dateRangeType,
}: {
  chartData: FetchProviderPerformanceMetricsResult;
  dateRangeType: ProviderMetricsDateRangeType;
}) {
  const { t } = useTranslation();
  const data: UnitsBilledChartData[] = useMemo(() => {
    return getChartData({
      dateRangeType,
      chartData,
    });
  }, [chartData, dateRangeType]);

  const activeIndex = data.findIndex((d) => d.dateString === DateTime.now().toFormat('LL/dd'));

  return (
    <>
      {/* Need to allow overflow to see X-axis label */}
      <style>
        {`
          svg.recharts-surface {
            overflow: visible !important;
          }
      `}
      </style>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid
            stroke="var(--neutral-115)"
            vertical={dateRangeType === ProviderMetricsDateRangeType.Custom}
          />
          {dateRangeType === ProviderMetricsDateRangeType.Custom ? (
            <XAxis
              label={{
                key: 'xAxisLabel',
                value: t('Day of month'),
                position: 'bottom',
                offset: 5,
              }}
              interval={0}
              dataKey="dateString"
              ticks={data.filter((p) => p.day === 1).map((d) => d.dateString)}
            />
          ) : (
            <XAxis
              label={{
                key: 'xAxisLabel',
                value: t('Day of month'),
                position: 'bottom',
                offset: 5,
              }}
              interval={0}
              dataKey="dateString"
              tickLine={false}
              ticks={
                data.length > 31
                  ? data.filter((p) => p.day % 2 === 0).map((d) => d.dateString)
                  : data.map((d) => d.dateString)
              }
              stroke="var(--neutral-400)"
            />
          )}
          <YAxis
            allowDecimals={false}
            tickLine={false}
            stroke="var(--neutral-400)"
            axisLine={false}
            label={{
              value: `Units`,
              style: { textAnchor: 'middle' },
              angle: -90,
              position: 'left',
              offset: 0,
            }}
          />
          <Tooltip
            cursor={{ fill: 'var(--neutral-100)' }}
            content={({ label, payload, active }) => {
              if (active && payload && payload.length) {
                const found = data.find((d) => d.dateString === label);
                return (
                  <div className="bg-neutral-1500 rounded-lg border-neutral-1500 p-6">
                    <p>
                      <span className="text-white">{`${found?.longDateString ?? label}: `}</span>
                      <span className="font-bold text-white">{`${payload[0].value} Units billed`}</span>
                    </p>
                  </div>
                );
              }
            }}
          />
          <Bar
            dataKey="unitsBilled"
            activeBar={{ fill: 'var(--fs-green-600)', strokeWidth: 2 }}
            activeIndex={
              dateRangeType === ProviderMetricsDateRangeType.Today ? activeIndex : undefined
            }
            fill={
              dateRangeType === ProviderMetricsDateRangeType.Today
                ? 'var(--neutral-115)'
                : 'var(--fs-green-200)'
            }
            name="Units Billed"
          />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}
