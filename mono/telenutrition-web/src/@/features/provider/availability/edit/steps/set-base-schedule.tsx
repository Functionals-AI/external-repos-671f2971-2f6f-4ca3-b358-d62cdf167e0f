import Section from '@/ui-components/section';
import { useEffect } from 'react';
import { FormItem, FormControl } from '@/ui-components/form/form';
import { Checkbox } from '@/ui-components/checkbox';
import { CheckedState } from '@radix-ui/react-checkbox';
import WeekViewTable, { Day, ExtraData } from '@/ui-components/week-view-table';
import { EditAvailabilityFields } from '..';
import { useMultiStepFormContext } from '@/modules/multi-step-form';
import { cn } from '@/utils';
import FormGroupItem from '@/modules/form/form-group-item';
import { useTranslation } from 'react-i18next';

const days: Day[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type ColumnStatus = 'all' | 'some' | 'none';

export interface SetBaseScheduleFields {
  availability: Record<string, CheckedState>;
}

export default function SetBaseSchedule() {
  const { t } = useTranslation();
  const { form, getValuesAssertDefined } = useMultiStepFormContext<EditAvailabilityFields>();

  const { dailyStartTime, dailyEndTime, baseWorkingDays, breaks } = getValuesAssertDefined([
    'dailyStartTime',
    'dailyEndTime',
    'baseWorkingDays',
    'breaks',
  ]);

  const getKey = (cell: { day: string; time: string }) => `${cell.day}-${cell.time}`;

  useEffect(() => void form.watch(), []);

  function getColumnStatus(day: string, extra: ExtraData): ColumnStatus {
    const cellsForDay = Object.entries(form.getValues().availability ?? {})
      .filter(([k, v]) => !!v)
      .filter(([k]) => k.split('-')[0] === day);

    if (cellsForDay && cellsForDay.length === extra.numRows) {
      return 'all';
    }

    if (cellsForDay && cellsForDay.length > 0) {
      return 'some';
    }

    return 'none';
  }

  function onColumnStatusChange(
    day: string,
    cells: { day: string; time: string }[],
    checked: CheckedState,
  ) {
    if (checked === true) {
      const filtered = cells.filter((cell) => cell.day === day);
      filtered.forEach((cell) => {
        form.setValue('availability', {
          ...(form.getValues().availability ?? {}),
          [getKey(cell)]: true,
        });
      });
    } else {
      form.setValue(
        'availability',
        Object.entries(form.getValues().availability ?? {})
          .filter(([k, v]) => k.split('-')[0] !== day)
          .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
      );
    }
  }

  return (
    <Section
      title={t('Default weekly schedule')}
      subtitle={t(
        'This will be used as your base schedule, you can make modifications by month next.',
      )}
    >
      <WeekViewTable
        days={days}
        renderRowLabelCell={(time) => (
          <div className="px-2 h-full flex items-center justify-center">{time}</div>
        )}
        renderHeaderCell={(day, i, extra) => {
          const colStatus = getColumnStatus(day, extra);
          return (
            <TableHeaderCell
              colStatus={colStatus}
              onCheckChanged={(checked) => onColumnStatusChange(day, extra.getAllCells(), checked)}
              day={day}
            />
          );
        }}
        renderCell={(cell) => {
          const key = getKey(cell);
          return (
            <div className="flex items-center justify-center w-full h-full">
              <FormGroupItem
                id="availability"
                form={form}
                render={({ getValue, onChange }) => {
                  const value = getValue(key);
                  return (
                    <FormItem
                      className={cn(
                        'h-full w-full flex items-center justify-center transition-all',
                        !!value && 'bg-status-green-100',
                      )}
                    >
                      <FormControl>
                        <Checkbox
                          checked={!!value}
                          onCheckedChange={(checked) => onChange(key, checked)}
                        />
                      </FormControl>
                    </FormItem>
                  );
                }}
              />
            </div>
          );
        }}
        startTime={dailyStartTime}
        endTime={dailyEndTime}
        increment={30}
      />
    </Section>
  );
}

function TableHeaderCell({
  colStatus,
  day,
  onCheckChanged,
}: {
  colStatus: ColumnStatus;
  day: Day;
  onCheckChanged: (checked: CheckedState) => void;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-y-1 p-2 items-center',
        colStatus === 'all' || colStatus === 'some' ? 'bg-status-green-100' : '',
      )}
    >
      <p>{day.slice(0, 3)}</p>
      <Checkbox
        checked={colStatus === 'some' ? 'indeterminate' : colStatus === 'all' ? true : false}
        checkType={colStatus === 'some' ? 'indeterminate' : 'checkbox'}
        onCheckedChange={onCheckChanged}
      />
    </div>
  );
}
