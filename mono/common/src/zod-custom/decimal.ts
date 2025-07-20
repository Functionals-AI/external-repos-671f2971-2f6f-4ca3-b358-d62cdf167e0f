import { Decimal } from "decimal.js";
import { z } from "zod";


interface ZodCustomDecimalOptions {
  maxScale?: number;
  min?: number;
  max?: number;
}

export function decimal(options?: ZodCustomDecimalOptions) {
  const { maxScale, min, max } = options || {};

  return z.string().superRefine((val, ctx) => {
    try {
      const decimalValue = new Decimal(val);
      if (decimalValue.isNaN()) {
        throw Error()
      }

      if (maxScale !== undefined && decimalValue.decimalPlaces() > maxScale) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Decimal value must have a maximum scale of ${maxScale}`
        });
      }

      if (min !== undefined && decimalValue.lessThan(min)) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: min,
          type: "number",
          inclusive: true,
          message: `Decimal value must be greater than or equal to ${min}`
        });
      }

      if (max !== undefined && decimalValue.greaterThan(max)) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_big,
          maximum: max,
          type: "number",
          inclusive: true,
          message: `Decimal value must be less than or equal to ${max}`
        });
      }
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid decimal value",
      });
    }
  }).transform(val => new Decimal(val));
}
