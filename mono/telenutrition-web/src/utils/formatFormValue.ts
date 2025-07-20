import dayjs from 'dayjs';
import { QuestionConfig } from '../api/api-types';

export function formatFormValue(question: QuestionConfig, value: string): string | number {
  if (question.widget === 'text:date') {
    return dayjs(value).format('MM/DD/YYYY');
  }

  if (question.key === 'insurance_id') {
    return Number(value);
  }

  if (question.widget === 'text:phone') {
    return value?.substring(0, 2) === '+1' ? value.substring(2) : value;
  }
  return value;
}
