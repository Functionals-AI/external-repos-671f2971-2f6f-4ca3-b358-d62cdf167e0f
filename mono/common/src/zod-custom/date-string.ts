import { z } from 'zod';
import { DateTime } from 'luxon';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

type IsoDateString = `${number}-${number}-${number}`;

interface DateStringOptions {}

export function dateString(options?: DateStringOptions) {
  return z.string().superRefine((val, ctx): val is IsoDateString => {
    try {
      if (ISO_DATE_REGEX.test(val) === false) {
        throw Error();
      }

      const parsedDate = DateTime.fromISO(val, { zone: 'utc' });
      if (parsedDate.isValid === false) {
        throw Error();
      }
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid date value',
      });
    }

    return z.NEVER;
  });
}
