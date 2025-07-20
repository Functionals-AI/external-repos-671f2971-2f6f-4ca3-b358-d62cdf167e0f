import Decimal from 'decimal.js';
import { decimal } from './decimal';

describe("decimal", () => {

  it('parses decimals with a maxScale of 1', async () => {
    const schema = decimal({ maxScale: 1 })

    expect(schema.parse("000000000000.1")).toEqual(new Decimal("000000000000.1"));
    expect(schema.parse("0.1")).toEqual(new Decimal("0.1"));
    expect(schema.parse("0.9")).toEqual(new Decimal("0.9"));
    expect(schema.parse("1")).toEqual(new Decimal("1"));
    expect(schema.parse("5")).toEqual(new Decimal("5"));
    expect(schema.parse("9")).toEqual(new Decimal("9"));
    expect(schema.parse("9.9")).toEqual(new Decimal("9.9"));

    expect(() => schema.parse("")).toThrow();
    expect(() => schema.parse("00000.00001")).toThrow();
    expect(() => schema.parse("0.01")).toThrow();
    expect(() => schema.parse("0.05")).toThrow();
    expect(() => schema.parse("0.09")).toThrow();
    expect(() => schema.parse("9.99")).toThrow();
    expect(() => schema.parse("9.99999999999")).toThrow();
  });

  it('parses decimals with a min of 1', async () => {
    const schema = decimal({ min: 1 })

    expect(schema.parse("1")).toEqual(new Decimal("1"));
    expect(schema.parse("1.00000")).toEqual(new Decimal("1.00000"));
    expect(schema.parse("1.000001")).toEqual(new Decimal("1.000001"));
    expect(schema.parse("1.1")).toEqual(new Decimal("1.1"));
    expect(schema.parse("10")).toEqual(new Decimal("10"));
    expect(schema.parse("100000000000")).toEqual(new Decimal("100000000000"));

    expect(() => schema.parse("0.9999999999")).toThrow();
    expect(() => schema.parse("0.9")).toThrow();
    expect(() => schema.parse(".9")).toThrow();
    expect(() => schema.parse(".01")).toThrow();
    expect(() => schema.parse(".00000000001")).toThrow();
  });

  it('parses decimals with a max of 1', async () => {
    const schema = decimal({ max: 1 })

    expect(schema.parse("-1")).toEqual(new Decimal("-1"));
    expect(schema.parse("-0.5")).toEqual(new Decimal("-0.5"));
    expect(schema.parse("0")).toEqual(new Decimal("0"));
    expect(schema.parse("0.5")).toEqual(new Decimal("0.5"));
    expect(schema.parse("1")).toEqual(new Decimal("1"));

    expect(() => schema.parse("1.00000000001")).toThrow();
    expect(() => schema.parse("1.1")).toThrow();
    expect(() => schema.parse("10")).toThrow();
    expect(() => schema.parse("100000000000")).toThrow();
  });

});
