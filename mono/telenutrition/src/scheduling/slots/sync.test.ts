import { AppointmentSlotSource, PartiallyBuiltScheduleSlot, build30OnlySlotsForProvider, build30Or60SlotsForProvider, build60OnlySlotsForProvider, buildScheduleSlotsForProvider } from './sync';
import { DateTime } from 'luxon'
import '@mono/common/lib/zapatos/schema'
import * as zs from 'zapatos/schema'
import { v4 as uuidv4 } from 'uuid';
import _ = require('lodash');
import { mockContext } from '@mono/common/lib/mocks/context'


type StoreScheduleSlotComparable = Pick<zs.telenutrition.schedule_slot.Insertable, 'slot_type' | 'start_timestamp' | 'end_timestamp' | 'duration' | 'appointment_ids'>

const expectStoreSlotsToBeEqual = (a: zs.telenutrition.schedule_slot.Insertable[], b: StoreScheduleSlotComparable[]) => {
  const mappedA = a.map(s => ({
    slot_type: s.slot_type,
    start_timestamp: s.start_timestamp,
    end_timestamp: s.end_timestamp,
    duration: s.duration,
    appointment_ids: s.appointment_ids,
  }))
  const mappedB = b.map(s => ({
    slot_type: s.slot_type,
    start_timestamp: s.start_timestamp,
    end_timestamp: s.end_timestamp,
    duration: s.duration,
    appointment_ids: s.appointment_ids,
  }))

  const sortedA = _.sortBy(mappedA, JSON.stringify)
  const sortedB = _.sortBy(mappedB, JSON.stringify)
  expect(sortedA).toStrictEqual(sortedB);
}

const expectPartialSlotsToBeEqual = (a: PartiallyBuiltScheduleSlot[], b: PartiallyBuiltScheduleSlot[]) => {
  const mappedA = a.map(s => ({
    start_timestamp: s.start_timestamp,
    slot_type: s.slot_type,
    duration: s.duration,
    appointment_ids: s.appointment_ids,
  }))
  const mappedB = b.map(s => ({
    start_timestamp: s.start_timestamp,
    slot_type: s.slot_type,
    duration: s.duration,
    appointment_ids: s.appointment_ids,
  }))

  const sortedA = _.sortBy(mappedA, JSON.stringify)
  const sortedB = _.sortBy(mappedB, JSON.stringify)
  expect(sortedA).toStrictEqual(sortedB);
}


describe("buildScheduleSlotsForProvider", () => {
  const fixedDateTime = DateTime.fromISO('2024-03-09T09:00:00Z')

  it('returns the expected slots for 2 back to back 30 min appointments', async () => {
    const appointments: AppointmentSlotSource[] = [
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: fixedDateTime.toJSDate(),
        duration: 30,
      }, {
        appointment_id: 2,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ minutes: 30 }).toJSDate(),
        duration: 30,
      }
    ]
    const expected: StoreScheduleSlotComparable[] = [
      {
        start_timestamp: fixedDateTime.toJSDate(),
        end_timestamp: fixedDateTime.plus({ minutes: 30 }).toJSDate(),
        slot_type: '30-only',
        duration: 30,
        appointment_ids: [1],
      },
      {
        start_timestamp: fixedDateTime.plus({ minutes: 30 }).toJSDate(),
        end_timestamp: fixedDateTime.plus({ minutes: 30 + 30 }).toJSDate(),
        slot_type: '30-only',
        duration: 30,
        appointment_ids: [2],
      },
      {
        start_timestamp: fixedDateTime.toJSDate(),
        end_timestamp: fixedDateTime.plus({ minutes: 60 }).toJSDate(),
        slot_type: '60-only',
        duration: 60,
        appointment_ids: [1, 2],
      },
      {
        start_timestamp: fixedDateTime.toJSDate(),
        end_timestamp: fixedDateTime.plus({ minutes: 60 }).toJSDate(),
        slot_type: '30-or-60',
        duration: 60,
        appointment_ids: [1, 2],
      },
    ]

    const result = buildScheduleSlotsForProvider(mockContext, { providerId: 1, appointments, syncToken: uuidv4() })
    expectStoreSlotsToBeEqual(result._unsafeUnwrap(), expected)
  });

  it('returns the expected slots for 2 back to back 60 min appointments', async () => {
    const appointments: AppointmentSlotSource[] = [
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: fixedDateTime.toJSDate(),
        duration: 60,
      }, {
        appointment_id: 2,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ hour: 1 }).toJSDate(),
        duration: 60,
      }
    ]
    const expected: StoreScheduleSlotComparable[] = [
      {
        start_timestamp: fixedDateTime.toJSDate(),
        end_timestamp: fixedDateTime.plus({ minutes: 60 }).toJSDate(),
        slot_type: '60-only',
        duration: 60,
        appointment_ids: [1],
      },
      {
        start_timestamp: fixedDateTime.plus({ hour: 1 }).toJSDate(),
        end_timestamp: fixedDateTime.plus({ hour: 1, minutes: 60 }).toJSDate(),
        slot_type: '60-only',
        duration: 60,
        appointment_ids: [2],
      },
      {
        start_timestamp: fixedDateTime.toJSDate(),
        end_timestamp: fixedDateTime.plus({ minutes: 60 }).toJSDate(),
        slot_type: '30-or-60',
        duration: 60,
        appointment_ids: [1],
      },
      {
        start_timestamp: fixedDateTime.plus({ hour: 1 }).toJSDate(),
        end_timestamp: fixedDateTime.plus({ hour: 1, minutes: 60 }).toJSDate(),
        slot_type: '30-or-60',
        duration: 60,
        appointment_ids: [2],
      },
    ]

    const result = buildScheduleSlotsForProvider(mockContext, { providerId: 1, appointments, syncToken: uuidv4() })
    expectStoreSlotsToBeEqual(result._unsafeUnwrap(), expected)
  });

  it('returns an empty array when provided with empty appointments', async () => {
    const appointments: AppointmentSlotSource[] = [];
    const expected: StoreScheduleSlotComparable[] = [];

    const result = buildScheduleSlotsForProvider(mockContext, { providerId: 1, appointments, syncToken: uuidv4() });
    expectStoreSlotsToBeEqual(result._unsafeUnwrap(), expected);
  });

  it('returns slots with the inputted sync token', () => {
    const syncToken = uuidv4()
    const appointments: AppointmentSlotSource[] = [
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: fixedDateTime.toJSDate(),
        duration: 60,
      }, {
        appointment_id: 2,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ hour: 1 }).toJSDate(),
        duration: 60,
      }
    ]

    const result = buildScheduleSlotsForProvider(mockContext, { providerId: 1, appointments, syncToken });
    const slots = result._unsafeUnwrap();

    expect(slots.every(slot => slot.sync_token === syncToken)).toBe(true);
  });

  it('floors the start_timestamp to the minute', async () => {
    const appointments: AppointmentSlotSource[] = [
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ seconds: 1 }).toJSDate(),
        duration: 30,
      }, {
        appointment_id: 2,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ minutes: 30, seconds: 59 }).toJSDate(),
        duration: 30,
      }
    ]
    const expected: StoreScheduleSlotComparable[] = [
      {
        start_timestamp: fixedDateTime.toJSDate(),
        end_timestamp: fixedDateTime.plus({ minutes: 30 }).toJSDate(),
        slot_type: '30-only',
        duration: 30,
        appointment_ids: [1],
      },
      {
        start_timestamp: fixedDateTime.plus({ minutes: 30 }).toJSDate(),
        end_timestamp: fixedDateTime.plus({ minutes: 30 + 30 }).toJSDate(),
        slot_type: '30-only',
        duration: 30,
        appointment_ids: [2],
      },
      {
        start_timestamp: fixedDateTime.toJSDate(),
        end_timestamp: fixedDateTime.plus({ minutes: 60 }).toJSDate(),
        slot_type: '60-only',
        duration: 60,
        appointment_ids: [1, 2],
      },
      {
        start_timestamp: fixedDateTime.toJSDate(),
        end_timestamp: fixedDateTime.plus({ minutes: 60 }).toJSDate(),
        slot_type: '30-or-60',
        duration: 60,
        appointment_ids: [1, 2],
      },
    ]

    const result = buildScheduleSlotsForProvider(mockContext, { providerId: 1, appointments, syncToken: uuidv4() })
    expectStoreSlotsToBeEqual(result._unsafeUnwrap(), expected)
  });

  it('only combines back to back appointments', async () => {
    const appointments: AppointmentSlotSource[] = [
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: fixedDateTime.toJSDate(),
        duration: 30,
      }, {
        appointment_id: 2,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ days: 7, minutes: 30 }).toJSDate(),
        duration: 30,
      }
    ]
    const expected: StoreScheduleSlotComparable[] = [
      {
        start_timestamp: fixedDateTime.toJSDate(),
        end_timestamp: fixedDateTime.plus({ minutes: 30 }).toJSDate(),
        slot_type: '30-only',
        duration: 30,
        appointment_ids: [1],
      },
      {
        start_timestamp: fixedDateTime.plus({ days: 7, minutes: 30 }).toJSDate(),
        end_timestamp: fixedDateTime.plus({ days: 7, minutes: 30 + 30 }).toJSDate(),
        slot_type: '30-only',
        duration: 30,
        appointment_ids: [2],
      },
      {
        start_timestamp: fixedDateTime.toJSDate(),
        end_timestamp: fixedDateTime.plus({ minutes: 30 }).toJSDate(),
        slot_type: '30-or-60',
        duration: 30,
        appointment_ids: [1],
      },
      {
        start_timestamp: fixedDateTime.plus({ days: 7, minutes: 30 }).toJSDate(),
        end_timestamp: fixedDateTime.plus({ days: 7, minutes: 30 + 30 }).toJSDate(),
        slot_type: '30-or-60',
        duration: 30,
        appointment_ids: [2],
      },
    ]

    const result = buildScheduleSlotsForProvider(mockContext, { providerId: 1, appointments, syncToken: uuidv4() })
    expectStoreSlotsToBeEqual(result._unsafeUnwrap(), expected)
  });

  it('does not include duplicate start timestamps', async () => {
    const appointments: AppointmentSlotSource[] = [
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: fixedDateTime.toJSDate(),
        duration: 30,
      }, {
        appointment_id: 2,
        provider_id: 1,
        start_timestamp: fixedDateTime.toJSDate(),
        duration: 30,
      },
      {
        appointment_id: 3,
        provider_id: 1,
        start_timestamp: fixedDateTime.toJSDate(),
        duration: 60,
      }
    ]
    const expected: StoreScheduleSlotComparable[] = [
      {
        start_timestamp: fixedDateTime.toJSDate(),
        end_timestamp: fixedDateTime.plus({ minutes: 30 }).toJSDate(),
        slot_type: '30-only',
        duration: 30,
        appointment_ids: [1],
      },
      {
        start_timestamp: fixedDateTime.toJSDate(),
        end_timestamp: fixedDateTime.plus({ minutes: 60 }).toJSDate(),
        slot_type: '60-only',
        duration: 60,
        appointment_ids: [3],
      },
      {
        start_timestamp: fixedDateTime.toJSDate(),
        end_timestamp: fixedDateTime.plus({ minutes: 60 }).toJSDate(),
        slot_type: '30-or-60',
        duration: 60,
        appointment_ids: [3],
      },
    ]

    const result = buildScheduleSlotsForProvider(mockContext, { providerId: 1, appointments, syncToken: uuidv4() })
    expectStoreSlotsToBeEqual(result._unsafeUnwrap(), expected)
  });

});


describe("build30OnlySlotsForProvider", () => {
  const fixedDateTime = DateTime.fromISO('2024-03-09T09:00:00Z')

  it('returns expected slots when there are 2 back to back 30 min appointments', async () => {
    const appointments: AppointmentSlotSource[] = [
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: fixedDateTime.toJSDate(),
        duration: 30,
      }, {
        appointment_id: 2,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ minutes: 30 }).toJSDate(),
        duration: 30,
      }
    ]
    const expected: PartiallyBuiltScheduleSlot[] = [
      {
        start_timestamp: fixedDateTime.toJSDate(),
        slot_type: '30-only',
        duration: 30,
        appointment_ids: [1],
      },
      {
        start_timestamp: fixedDateTime.plus({ minutes: 30 }).toJSDate(),
        slot_type: '30-only',
        duration: 30,
        appointment_ids: [2],
      },
    ]

    const result = build30OnlySlotsForProvider(mockContext, appointments)
    expectPartialSlotsToBeEqual(result._unsafeUnwrap(), expected)
  });

  it('returns expected slots when there is a single 30 min appointment at the top of the hour', async () => {
    const appointments: AppointmentSlotSource[] = [
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: fixedDateTime.toJSDate(),
        duration: 30,
      }
    ]
    const expected: PartiallyBuiltScheduleSlot[] = [
      {
        start_timestamp: fixedDateTime.toJSDate(),
        slot_type: '30-only',
        duration: 30,
        appointment_ids: [1],
      },
    ]

    const result = build30OnlySlotsForProvider(mockContext, appointments)
    expectPartialSlotsToBeEqual(result._unsafeUnwrap(), expected)
  });

  it('ensures slots are at the top or mid of the hour', async () => {
    const appointments: AppointmentSlotSource[] = [
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ minute: 2 }).toJSDate(),
        duration: 30,
      },
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ minute: 58 }).toJSDate(),
        duration: 30,
      },
    ]
    const expected: PartiallyBuiltScheduleSlot[] = []

    const result = build30OnlySlotsForProvider(mockContext, appointments)
    expectPartialSlotsToBeEqual(result._unsafeUnwrap(), expected)
  });

  it('returns an empty array when there are no 30-minute appointments', async () => {
    const appointments: AppointmentSlotSource[] = [
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: fixedDateTime.toJSDate(),
        duration: 60,
      }
    ];
    const expected: PartiallyBuiltScheduleSlot[] = [];

    const result = build30OnlySlotsForProvider(mockContext, appointments);
    expectPartialSlotsToBeEqual(result._unsafeUnwrap(), expected);
  });

});


describe("build60OnlySlotsForProvider", () => {
  const fixedDateTime = DateTime.fromISO('2024-03-09T09:00:00Z')

  it('combines 2 back to back 30 min appointments', async () => {
    const appointments: AppointmentSlotSource[] = [
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: fixedDateTime.toJSDate(),
        duration: 30,
      }, {
        appointment_id: 2,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ minutes: 30 }).toJSDate(),
        duration: 30,
      }
    ]
    const expected: PartiallyBuiltScheduleSlot[] = [
      {
        start_timestamp: fixedDateTime.toJSDate(),
        slot_type: '60-only',
        duration: 60,
        appointment_ids: [1, 2],
      },
    ]

    const result = build60OnlySlotsForProvider(mockContext, appointments)
    expectPartialSlotsToBeEqual(result._unsafeUnwrap(), expected)
  });

  it('prioritizes using 60 minute appointments', async () => {
    const appointments: AppointmentSlotSource[] = [
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: fixedDateTime.toJSDate(),
        duration: 30,
      },
      {
        appointment_id: 2,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ minutes: 30 }).toJSDate(),
        duration: 30,
      },
      {
        appointment_id: 3,
        provider_id: 1,
        start_timestamp: fixedDateTime.toJSDate(),
        duration: 60,
      },
      {
        appointment_id: 4,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ minutes: 30 }).toJSDate(),
        duration: 30,
      }
    ]
    const expected: PartiallyBuiltScheduleSlot[] = [
      {
        start_timestamp: fixedDateTime.toJSDate(),
        slot_type: '60-only',
        duration: 60,
        appointment_ids: [3],
      },
    ]

    const result = build60OnlySlotsForProvider(mockContext, appointments)
    expectPartialSlotsToBeEqual(result._unsafeUnwrap(), expected)
  });

  it('returns the expected slots for a back to back 30 min and 60 min appointment', async () => {
    const appointments: AppointmentSlotSource[] = [
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ minutes: 30 }).toJSDate(),
        duration: 30,
      }, {
        appointment_id: 2,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ hour: 1 }).toJSDate(),
        duration: 60,
      }
    ]
    const expected: PartiallyBuiltScheduleSlot[] = [
      {
        start_timestamp: fixedDateTime.plus({ hour: 1 }).toJSDate(),
        slot_type: '60-only',
        duration: 60,
        appointment_ids: [2],
      },
    ]

    const result = build60OnlySlotsForProvider(mockContext, appointments)
    expectPartialSlotsToBeEqual(result._unsafeUnwrap(), expected)
  });

  it('ensures slots are at the top of the hour', async () => {
    const appointments: AppointmentSlotSource[] = [
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ minute: 2 }).toJSDate(),
        duration: 60,
      },
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ minute: 30 }).toJSDate(),
        duration: 60,
      },
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ minute: 58 }).toJSDate(),
        duration: 60,
      },
    ]
    const expected: PartiallyBuiltScheduleSlot[] = []

    const result = build60OnlySlotsForProvider(mockContext, appointments)
    expectPartialSlotsToBeEqual(result._unsafeUnwrap(), expected)
  });

  it('returns an empty array when there are no 60-minute appointments', async () => {
    const appointments: AppointmentSlotSource[] = [
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: fixedDateTime.toJSDate(),
        duration: 30,
      }
    ];
    const expected: PartiallyBuiltScheduleSlot[] = [];

    const result = build60OnlySlotsForProvider(mockContext, appointments);
    expectPartialSlotsToBeEqual(result._unsafeUnwrap(), expected);
  });

});


describe("build30Or60SlotsForProvider", () => {
  const fixedDateTime = DateTime.fromISO('2024-03-09T09:00:00Z')

  it('combines 2 back to back 30 min appointments', async () => {
    const appointments: AppointmentSlotSource[] = [
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: fixedDateTime.toJSDate(),
        duration: 30,
      }, {
        appointment_id: 2,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ minutes: 30 }).toJSDate(),
        duration: 30,
      }
    ]
    const expected: PartiallyBuiltScheduleSlot[] = [
      {
        start_timestamp: fixedDateTime.toJSDate(),
        slot_type: '30-or-60',
        duration: 60,
        appointment_ids: [1, 2],
      },
    ]

    const result = build30Or60SlotsForProvider(mockContext, appointments)
    expectPartialSlotsToBeEqual(result._unsafeUnwrap(), expected)
  });

  it('returns the expected slots for a back to back 30 min and 60 min appointment', async () => {
    const appointments: AppointmentSlotSource[] = [
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ minutes: 30 }).toJSDate(),
        duration: 30,
      }, {
        appointment_id: 2,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ hour: 1 }).toJSDate(),
        duration: 60,
      }
    ]
    const expected: PartiallyBuiltScheduleSlot[] = [
      {
        start_timestamp: fixedDateTime.plus({ minutes: 30 }).toJSDate(),
        slot_type: '30-or-60',
        duration: 30,
        appointment_ids: [1],
      },
      {
        start_timestamp: fixedDateTime.plus({ hour: 1 }).toJSDate(),
        slot_type: '30-or-60',
        duration: 60,
        appointment_ids: [2],
      },
    ]

    const result = build30Or60SlotsForProvider(mockContext, appointments)
    expectPartialSlotsToBeEqual(result._unsafeUnwrap(), expected)
  });

  it('prioritizes using 60 minute appointments', async () => {
    const appointments: AppointmentSlotSource[] = [
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: fixedDateTime.toJSDate(),
        duration: 30,
      },
      {
        appointment_id: 2,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ minutes: 30 }).toJSDate(),
        duration: 30,
      },
      {
        appointment_id: 3,
        provider_id: 1,
        start_timestamp: fixedDateTime.toJSDate(),
        duration: 60,
      },
      {
        appointment_id: 4,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ minutes: 30 }).toJSDate(),
        duration: 30,
      }
    ]
    const expected: PartiallyBuiltScheduleSlot[] = [
      {
        start_timestamp: fixedDateTime.toJSDate(),
        slot_type: '30-or-60',
        duration: 60,
        appointment_ids: [3],
      },
    ]

    const result = build30Or60SlotsForProvider(mockContext, appointments)
    expectPartialSlotsToBeEqual(result._unsafeUnwrap(), expected)
  });

  it('ensures 60 min slots are at the top of the hour and 30 min slots are at the mid of the hour', async () => {
    const appointments: AppointmentSlotSource[] = [
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ minute: 2 }).toJSDate(),
        duration: 60,
      },
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ minute: 30 }).toJSDate(),
        duration: 60,
      },
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ minute: 58 }).toJSDate(),
        duration: 60,
      },
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ minute: 2 }).toJSDate(),
        duration: 30,
      },
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: fixedDateTime.plus({ minute: 58 }).toJSDate(),
        duration: 30,
      },
    ]
    const expected: PartiallyBuiltScheduleSlot[] = []

    const result = build30Or60SlotsForProvider(mockContext, appointments)
    expectPartialSlotsToBeEqual(result._unsafeUnwrap(), expected)
  });

  it('returns an empty array when there are no 30 or 60-minute appointments', async () => {
    const appointments: AppointmentSlotSource[] = [
      {
        appointment_id: 1,
        provider_id: 1,
        start_timestamp: DateTime.fromISO('2024-03-09T09:00:00Z').toJSDate(),
        duration: 15,
      }
    ];
    const expected: PartiallyBuiltScheduleSlot[] = [];

    const result = build30Or60SlotsForProvider(mockContext, appointments);
    expectPartialSlotsToBeEqual(result._unsafeUnwrap(), expected);
  });

});
