import { DateTime } from 'luxon';

export type PatientProgram = {
  id: string;
  module: string;
  status: string;
  assigned: string;
  started: string;
  completed?: string;
};

export const data: PatientProgram[] = [
  {
    id: '1',
    module: 'SMART GOALS: Setting your foundation',
    status: 'in progress',
    assigned: '12 Nov 2021',
    started: '12 Nov 2021',
  },
  {
    id: '2',
    module: 'Budget Friendly Food Staples',
    status: 'in progress',
    assigned: '12 Nov 2021',
    started: '12 Nov 2021',
  },
  {
    id: '3',
    module: 'NutriQuiz',
    status: 'completed',
    assigned: '12 Nov 2021',
    started: '12 Nov 2021',
    completed: '12 Nov 2021',
  },
  {
    id: '4',
    module: 'What makes a healthy heart?',
    status: 'completed',
    assigned: '12 Nov 2021',
    started: '12 Nov 2021',
    completed: '12 Nov 2021',
  },
  {
    id: '5',
    module: 'Meal Planning For Diabetes',
    status: 'completed',
    assigned: '12 Nov 2021',
    started: '12 Nov 2021',
    completed: '12 Nov 2021',
  },
];
