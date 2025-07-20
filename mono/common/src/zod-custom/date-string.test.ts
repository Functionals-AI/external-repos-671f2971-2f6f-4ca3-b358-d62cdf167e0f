import { dateString } from './date-string';

describe("dateString", () => {

  it('parses dates', async () => {
    const schema = dateString()

    expect(schema.parse("2000-01-01")).toEqual("2000-01-01");
    expect(schema.parse("3000-12-30")).toEqual("3000-12-30");

    expect(() => schema.parse("")).toThrow();
    expect(() => schema.parse("20000101")).toThrow();
    expect(() => schema.parse(" 2000-01-01 ")).toThrow();
    expect(() => schema.parse("2000/01/01")).toThrow();
    expect(() => schema.parse("abc")).toThrow();
    expect(() => schema.parse("01/01/2000")).toThrow();
    expect(() => schema.parse("2000-72-72")).toThrow();
  });

});
