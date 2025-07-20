import { v4 as uuidv4 } from 'uuid';

export type Patient = {
  id: string;
  name: string;
  sex: string;
  email: string;
  pronouns: string;
  status: string;
  lastSession: Date;
  nextSession: Date;
  birthday: Date;
  phoneNumber: string;
  street: string;
  city: string;
  state: string;
  zipCode: number;
  snapEnrollment: string;
  conditions: string;
  programEnrollment: string;
};

export type PatientTableRow = Patient | Patient[];

const getRand = (max: number, min?: number) => {
  return Math.floor(Math.random() * max) + (min ?? 0);
};

const getRandomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.floor(Math.random() * (end.getTime() - start.getTime())));
};

const getRandomPatient = () => {
  const id = uuidv4();
  const firstName = [
    'Jacob',
    'Michael',
    'Ethan',
    'Joshua',
    'Daniel',
    'Alexander',
    'Anthony',
    'William',
    'Christopher',
    'Matthew',
    'Jayden',
  ][getRand(10)];
  const lastName = [
    'Smith',
    'Johnson',
    'Williams',
    'Brown',
    'Jones',
    'Miller',
    'Davis',
    'Garcia',
    'Rodriguez',
    'Wilson',
  ][getRand(10)];
  const name = `${firstName} ${lastName}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`;
  const sex = getRand(2) === 0 ? 'M' : 'F';
  const pronouns = sex === 'M' ? 'he/him/his' : 'she/her/hers';
  const status = ['active', 'inactive', 'no coverage'][getRand(3)];
  const lastSession = getRandomDate(new Date('09/01/23'), new Date());
  const nextSession = getRandomDate(new Date(), new Date('01/01/25'));
  const birthday = getRandomDate(new Date('01/01/70'), new Date());
  const phoneNumber = `+1${getRand(1000000000)}`;
  const street = '5181 James St';
  const city = 'Anaheim';
  const state = 'California';
  const zipCode = 90620;
  const snapEnrollment = 'Eligible (not enrolled)';
  const conditions = 'Hypertension, diabetes, obesity';
  const programEnrollment = 'Diabetes Management, Heart Health';
  return {
    id,
    name,
    email,
    sex,
    pronouns,
    status,
    lastSession,
    nextSession,
    birthday,
    phoneNumber,
    street,
    city,
    state,
    zipCode,
    snapEnrollment,
    conditions,
    programEnrollment,
  };
};

export const data: PatientTableRow[] = new Array(45).fill(0).map((_, ind) => {
  if (ind % 5 === 3) {
    const num = getRand(3, 2);
    return new Array(num).fill(0).map(() => getRandomPatient());
  }
  return getRandomPatient();
});
