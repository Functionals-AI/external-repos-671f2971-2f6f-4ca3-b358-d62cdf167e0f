export enum LocaleEnum {
  EN = 'en',
  ES = 'es',
  DEFAULT = 'en',
}

// find the best locale match from set of raw locale strings
export function matchLocale(locales: string[]): LocaleEnum {
  for (let locale of locales) {
    if (/^es/i.test(locale)) {
      return LocaleEnum.ES
    }
  }
  return LocaleEnum.DEFAULT
}