import { languageToISO, toFirstOrLastName } from './normalize';

describe('normalize', () => {
  test('languageToISO', () => {
    expect(languageToISO('english')).toBe('en')
    expect(languageToISO('English')).toBe('en')
    expect(languageToISO('ENGLISH')).toBe('en')
    expect(languageToISO('en')).toBe('en')
    expect(languageToISO('none')).toBe('')
    expect(languageToISO('')).toBe('')
    expect(languageToISO('not a language')).toBe('')
  })

  test('toFirstOrLastName', () => {
    expect(toFirstOrLastName('john')).toBe('John')
    expect(toFirstOrLastName('JOHN')).toBe('John')
    expect(toFirstOrLastName('John')).toBe('John')
  })
})
