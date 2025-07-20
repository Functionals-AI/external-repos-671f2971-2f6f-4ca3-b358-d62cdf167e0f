export enum AppointmentTypeId {
  Initial30Minutes = 1,
  Initial60Minutes = 2,
  FollowUp30Minutes = 3,
  FollowUp60Minutes = 221,
}

// Beware that audio visits may map to a different appointment type id
export const InitialAppointmentTypeIds = [
  AppointmentTypeId.Initial30Minutes,
  AppointmentTypeId.Initial60Minutes,
]