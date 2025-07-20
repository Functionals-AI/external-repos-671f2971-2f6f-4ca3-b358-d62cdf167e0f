import { DateTime } from 'luxon';

export type PatientWeight = {
  id: string;
  weight: number;
  date: string;
};

const getRandFromRange = (min: number, max: number) => {
  return min + Math.floor(Math.random() * (max - min));
};

const getRandomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.floor(Math.random() * (end.getTime() - start.getTime())));
};

export const data: PatientWeight[] = new Array(3).fill(0).map((_, ind) => ({
  id: `${ind}`,
  weight: getRandFromRange(240, 250),
  date: DateTime.fromJSDate(getRandomDate(new Date('09/01/23'), new Date())).toLocaleString(DateTime.DATE_MED),
}));
