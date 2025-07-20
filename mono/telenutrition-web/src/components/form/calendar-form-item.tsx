import Calendar from '../calendar';
import { CalendarProps as ReactCalendarProps } from 'react-calendar';
import { RegisterOptions, useFormContext } from 'react-hook-form';
import FormItemLabel from './form-item-label';
import FormItemFooter from './form-item-footer';
import { QuestionDisclaimer } from '../../api/api-types';

type CalendarFormItemProps = ReactCalendarProps & {
  label: string;
  questionKey: string;
  registerOptions: RegisterOptions;
  disclaimer: QuestionDisclaimer;
};

// Assumed to be used for birthday. Can be overridden
export default function CalendarFormItem({
  label,
  questionKey,
  registerOptions,
  disclaimer,
  ...calendarProps
}: CalendarFormItemProps) {
  const { setValue } = useFormContext();
  return (
    <>
      <FormItemLabel name={label} />
      <Calendar
        onChange={(d: Date) => {
          setValue(questionKey, d);
        }}
        maxDate={new Date()}
        defaultActiveStartDate={new Date('1990, 1, 1')}
        {...calendarProps}
      />
      <FormItemFooter {...{ questionKey, disclaimer }} />
    </>
  );
}
