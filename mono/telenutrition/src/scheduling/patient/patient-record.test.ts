import { mapPatientRecord } from './patient-record';

describe('scheduling patient store', () => {
  let record = {
    identity: {
      birthday: null,
    }
  } as any;

  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2024-01-15'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('returns undefined if birthdate is null', () => {
    const result = mapPatientRecord(record);
    expect(result.age).toBeUndefined();
  });

  it('ages are calculated correctly', () => {
    const cases = [
      { value: '2000-01-01', expected: 24 },
      { value: '2000-01-30', expected: 23 },
      { value: '2024-01-15', expected: 0 },
      { value: '2000-02-29', expected: 23 },
    ];

    for (const { value, expected } of cases) {
      record.identity.birthday = value;
      const result = mapPatientRecord(record);
      expect(result.age).toBe(expected);
    }
  });

  it('will prioritize identity.birthday over birthday', () => {
    record.identity.birthday = '2000-01-01';
    record.birthday = '2000-01-30';
    const result = mapPatientRecord(record);
    expect(result.age).toBe(24);
  });
});
