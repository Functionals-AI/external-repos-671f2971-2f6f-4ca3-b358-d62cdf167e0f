import Section from '@/ui-components/section';
import { useMultiStepFormContext } from '@/modules/multi-step-form';
import { useModal } from '@/modules/modal';
import SelectFormItem from '@/modules/form/select-item';
import FormTableItem, {
  BasicTableRowDisplay,
  FormTableItemEntry,
  OnAddEntryFn,
  TFormTableItem,
} from '@/modules/form/form-table-item';
import { CheckedState } from '@radix-ui/react-checkbox';
import { ReactNode } from 'react';
import { TimeString, VALID_TIMESLOTS, getValidEndTimeslots } from '../utils';
import CheckboxList from '@/modules/form/checkbox-list';
import AddBreakModal from '../components/add-break-modal';
import AddHolidayModal from '../components/add-holiday-modal';
import { Day } from '@/ui-components/week-view-table';
import { useTranslation } from 'react-i18next';

export interface BreakData {
  breakDays: Record<string, CheckedState>;
  breakStartTime: TimeString;
  breakEndTime: TimeString;
}

export enum HolidayRepeatType {
  NONE = 'none',
}

export type BaseWorkingDays = { [k in Day]?: CheckedState };

export interface HolidayData {
  date: Date;
  repeatType: HolidayRepeatType;
}

const DAYS: Day[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface GeneralSettingsFields {
  dailyStartTime?: TimeString;
  dailyEndTime?: TimeString;
  holidays: TFormTableItem<HolidayData>;
  baseWorkingDays: BaseWorkingDays;
  breaks: TFormTableItem<BreakData>;
}

export default function GeneralSettings() {
  const { t } = useTranslation();
  const { form } = useMultiStepFormContext<GeneralSettingsFields>();
  const modal = useModal();
  const values = form.getValues();

  function openAddHolidayModal(onAdd: OnAddEntryFn<HolidayData>) {
    modal.openPrimary({
      type: 'custom',
      showCloseButton: true,
      modal: (
        <AddHolidayModal
          onSubmit={(value) => {
            onAdd({ key: JSON.stringify(value), value });
            modal.closeAll();
          }}
        />
      ),
    });
  }

  function openAddBreakModal(onAdd: OnAddEntryFn<BreakData>) {
    const { baseWorkingDays } = form.getValues();
    modal.openPrimary({
      type: 'custom',
      showCloseButton: true,
      modal: (
        <AddBreakModal
          baseWorkingDays={baseWorkingDays}
          onSubmit={(value) => {
            onAdd({ key: JSON.stringify(value), value });
            modal.closeAll();
          }}
        />
      ),
    });
  }

  return (
    <>
      <Section title={t('Default working hours')}>
        <Section.ContentBasicMaxWidth className="flex flex-col gap-y-6">
          <CheckboxList
            label={t('Set your base work days')}
            description={t(
              'You will be able to update individual days, months, and weeks in the next step.',
            )}
            form={form}
            id="baseWorkingDays"
            rules={{ required: true }}
            options={DAYS.map((day) => ({ label: day, value: day }))}
          />
          <GroupWithLabel
            header={t('Set general working time')}
            subheader={t(
              'This will set your basic working window, you can add special openings in a later step.',
            )}
          >
            <div className="inline-flex gap-x-2">
              <SelectFormItem
                id="dailyStartTime"
                form={form}
                label={t('Daily start time')}
                options={VALID_TIMESLOTS}
                rules={{ required: true }}
              />
              <SelectFormItem
                id="dailyEndTime"
                form={form}
                label={t('Daily end time')}
                rules={{ required: true }}
                disabled={!values.dailyStartTime}
                options={getValidEndTimeslots(values.dailyStartTime)}
              />
            </div>
          </GroupWithLabel>
          <FormTableItem
            form={form}
            id="breaks"
            label={t('Breaks')}
            addText={t('Add break')}
            onAddEntry={(onAdd) => {
              openAddBreakModal(onAdd);
            }}
            renderEntry={(entry: FormTableItemEntry<BreakData>) => (
              <BasicTableRowDisplay
                label={`${entry.value.breakStartTime} - ${entry.value.breakEndTime}`}
                description={Object.keys(entry.value.breakDays)
                  .map((day) => day.slice(0, 1))
                  .join(', ')}
              />
            )}
            onNoEntriesText={t('No breaks')}
          />
        </Section.ContentBasicMaxWidth>
      </Section>
      <Section.Divider />
      <Section title={t('Holiday Schedule')}>
        <Section.ContentBasicMaxWidth>
          <FormTableItem
            form={form}
            id="holidays"
            addText={t('Add holiday')}
            onAddEntry={(onAdd) => {
              openAddHolidayModal(onAdd);
            }}
            renderEntry={(entry: FormTableItemEntry<HolidayData>) => (
              <BasicTableRowDisplay
                label={`${entry.value.date.toLocaleDateString()}`}
                description={t('Repeats: {{repeatType}}', { repeatType: entry.value.repeatType })}
              />
            )}
            onNoEntriesText={t('No holidays')}
            label="Holidays"
          />
        </Section.ContentBasicMaxWidth>
      </Section>
    </>
  );
}

function GroupWithLabel({
  header,
  subheader,
  children,
}: {
  header: string;
  subheader: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <p className="text-neutral-1500 text-sm leading-4">{header}</p>
      <p className="text-neutral-700 mb-2 text-sm leading-4">{subheader}</p>
      {children}
    </div>
  );
}
