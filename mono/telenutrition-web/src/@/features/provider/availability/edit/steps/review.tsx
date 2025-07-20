import { useMultiStepFormContext } from '@/modules/multi-step-form';
import { EditAvailabilityFields } from '..';
import Section from '@/ui-components/section';
import { WeekPickerCalendar, useWeekPicker } from '@/modules/calendar/week-view';
import TextArea from '@/ui-components/text-area';
import { cn } from '@/utils';
import WeekNavigator from '@/modules/calendar/week-view/week-navigator';
import { DateTime } from 'luxon';
import DataDisplay from '@/ui-components/data-display';
import GenericTable from '@/modules/data-table/generic-table';
import { ColumnDef } from '@tanstack/react-table';
import { HolidayData } from './general-settings';
import { SortableColumnHeader } from '@/modules/data-table/components/sortable-column-header';
import { useTranslation } from 'react-i18next';

const holidayColumns: ColumnDef<HolidayData>[] = [
  {
    accessorKey: 'date',
    header: ({ column }) => <SortableColumnHeader column={column}>Date</SortableColumnHeader>,
    cell: ({ row }) => (
      <div>{DateTime.fromJSDate(row.original.date).toFormat('LLLL dd, yyyy')}</div>
    ),
  },
];

export default function Review({ providerTimezone }: { providerTimezone: string }) {
  const { t } = useTranslation();
  const { form, getValuesAssertDefined } = useMultiStepFormContext<
    EditAvailabilityFields & { notes?: string }
  >();
  const weekPicker = useWeekPicker(providerTimezone);

  const { availability, dailyStartTime, dailyEndTime, holidays } = getValuesAssertDefined([
    'availability',
    'dailyStartTime',
    'dailyEndTime',
    'holidays',
  ]);

  return (
    <>
      <Section
        title="Review calendar"
        subtitle={
          <p className="text-neutral-700 text-sm">{t('Tap on a time slot to make changes.')}</p>
        }
      >
        <Section.ContentBasicMaxWidth>
          <div className="grid gird-cols-2 gap-8">
            <DataDisplay className="col-span-1" label="Daily start time" content={dailyStartTime} />
            <DataDisplay className="col-span-1" label="Daily end time" content={dailyEndTime} />

            <div className="col-span-2">
              <h4 className="text-lg text-neutral-1500 mb-2">{t('Holidays')}</h4>
              {/* TODO */}
              {/* <GenericTable data={holidays.map((d) => d.value)} columns={holidayColumns} /> */}
            </div>
          </div>
        </Section.ContentBasicMaxWidth>
      </Section>
      <Section.Divider />
      <Section
        title="Review calendar"
        subtitle={
          <div className="flex flex-col">
            <p className="text-neutral-700 text-sm">{t('Tap on a time slot to make changes.')}</p>
            <WeekPickerCalendar {...weekPicker} />
          </div>
        }
      >
        <WeekNavigator
          {...weekPicker}
          renderCell={(date, day) => {
            const found =
              form.getValues().availability?.[
                `${day}-${DateTime.fromJSDate(date).toFormat('hh:mma')}`
              ];

            return (
              <div
                className={cn(
                  'flex items-center justify-center h-full w-full',
                  !!found && 'bg-status-green-100',
                )}
              ></div>
            );
          }}
          renderColKey={(date, day) => (
            <div className="flex flex-col p-4 items-center justify-center h-full">
              <h6>{day}</h6>
              <p>{DateTime.fromJSDate(date).toFormat('dd')}</p>
            </div>
          )}
          days={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']}
          startTime={dailyStartTime}
          endTime={dailyEndTime}
          increment={30}
        />
      </Section>
      <Section.Divider />
      <Section title="Notes">
        <Section.ContentBasicMaxWidth>
          <TextArea id="notes" form={form} placeholder={t('Notes (optional)')} />
        </Section.ContentBasicMaxWidth>
      </Section>
    </>
  );
}
