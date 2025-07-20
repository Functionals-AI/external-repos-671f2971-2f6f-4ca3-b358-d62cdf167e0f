export const getTimezoneName = (timezone: string) => {
  return new Date()
    .toLocaleTimeString('en-us', { timeZone: timezone, timeZoneName: 'long' })
    .split(' ')[2];
};
