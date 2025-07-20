/**
 * Utilities to normalize data values such as for persistence as strings (ie: in CSV files).
 */
import * as _ from 'lodash'
import { DateTime } from 'luxon'
import { phone } from 'phone'

/**
 * To 'YYYY-MM-DD'
 * 
 * @param context,
 * @param date
 */
export function dateToDate(date: Date): string {
  return DateTime.fromJSDate(date).toISODate() as string
}

/**
 * To ISO UTC Timestamp, ie: 1982-05-25T00:00:00.000Z
 */
export function dateToISOTimestamp(date: Date): string {
  return DateTime.fromJSDate(date).toUTC().toISO() as string
}

/**
 * Accepts either a plain language name (like 'english') or an ISO language code
 * and outputs the ISO code.
 * 
 * If the input language is not known by the mapper returns an empty string.
 * 
 * Ignores case
 */
export function languageToISO(language: string): string {
  // Normalize input string
  language = language.trim().toLowerCase()

  const languageMap = new Map<string, string>([
    [ "spanish", "es" ],
    [ "english", "en" ],
    [ "vietnamese", "vi"],
    [ "russian", "ru"],
    [ "farsi", "fa"],
    [ "arabic", "ar"],
    [ "mandarin", "zh"],
  ]);

  // Check if the value passed in is already a valid ISO language code
  if (Array.from(languageMap.values()).includes(language)) {
    return language
  }

  return languageMap.get(language) || ""
}

export function toFirstOrLastName(name: string): string {
  return _.capitalize(name)
}

/**
 * Normalize to E.164. Return input if phone is invalid.
 * 
 * @param phoneNumber
 */
export function toPhone(phoneNumber: string): string {
  const validated = phone(phoneNumber, { validateMobilePrefix: false })

  return validated.isValid ? validated.phoneNumber : phoneNumber
}

/**
 * Normalize to E.164. Return input if phone is invalid or landline.
 * 
 * @param phoneNumber
 */
export function toMobilePhone(phoneNumber: string): string {
  const validated = phone(phoneNumber, { validateMobilePrefix: true })

  return validated.isValid ? validated.phoneNumber : phoneNumber
}
