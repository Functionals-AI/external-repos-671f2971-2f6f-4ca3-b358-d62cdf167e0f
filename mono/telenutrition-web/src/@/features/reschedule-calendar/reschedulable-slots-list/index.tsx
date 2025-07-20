import { CalendarItemHour } from '@/selectors/calendarItemsSelector';
import Card from '@/ui-components/card';
import RenderHourBlock from './render-hour-block';
import {
  CalendarExpanderProvider,
  useCalendarExpanders,
} from '@/features/provider/dashboard/calendar/calendar-expanders';
import CalendarExpanders, {
  calendarItemTimeslotId,
} from '@/features/provider/dashboard/calendar/calendar-expanders/expanders';
import { useRescheduleCalendarContext } from '../context';
import { cn } from '@/utils';
import { FormControl, FormField, FormItem } from '@/ui-components/form/form';
import { RadioGroup as HeadlessRadioGroup } from '@headlessui/react';
import Icon from '@/ui-components/icons/Icon';

interface ReschedulableSlotsListProps {
  calendarItemsList: CalendarItemHour[];
}

export default function ReschedulableSlotsList({ calendarItemsList }: ReschedulableSlotsListProps) {
  const { providerTimezone, form } = useRescheduleCalendarContext();
  const calendarExpanders = useCalendarExpanders({
    calendarItems: calendarItemsList,
    timezone: providerTimezone,
  });

  const error = form.formState.errors.timeISO;

  const displayedGroups = calendarExpanders.getFilteredCalendarItems(calendarItemsList);

  if (displayedGroups.length === 0) {
    return <Card>No appointments available</Card>;
  }

  return (
    <div className="flex flex-col gap-y-2">
      <Card className={cn(error && 'border-status-red-600')}>
        <CalendarExpanderProvider {...calendarExpanders}>
          <CalendarExpanders.TopExpander className="flex justify-center" />
          <FormField
            rules={{ required: true }}
            control={form.control}
            name="timeISO"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <HeadlessRadioGroup {...field}>
                    <div className="flex flex-col">
                      {displayedGroups.map((item) => {
                        const hour = item.topOfHourTimeslot.dateTime.setZone(providerTimezone).hour;
                        const key = calendarItemTimeslotId(
                          parseInt(item.topOfHourTimeslot.dateTime.toFormat('H')),
                        );
                        return (
                          <div key={key} id={key}>
                            <CalendarExpanders.TopCollapser
                              hour={hour}
                              className="flex justify-center"
                            />
                            <RenderHourBlock key={item.topOfHourTimeslot.time} item={item} />
                            <CalendarExpanders.BottomCollapser
                              hour={hour}
                              className="flex justify-center"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </HeadlessRadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
          <CalendarExpanders.BottomExpander className="flex justify-center" />
        </CalendarExpanderProvider>
      </Card>
      {error && (
        <p className="text-xs font-bold text-status-red-800 flex items-center gap-x-2">
          <Icon name="alert-octagon" color="statusRed800" size="xs" />
          {error.message || 'Required'}
        </p>
      )}
    </div>
  );
}
