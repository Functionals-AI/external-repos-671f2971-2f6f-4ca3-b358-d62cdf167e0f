import type { RadioTableQuestion } from '@mono/telenutrition/lib/types';

export const radioGroupTable1: RadioTableQuestion = {
  type: 'radio-table',
  key: 'radio-table-1',
  columns: [
    {
      type: 'radio',
      label: 'Often',
      value: 'often',
    },
    {
      type: 'radio',
      label: 'Some',
      value: 'some',
    },
    {
      type: 'radio',
      label: 'Never',
      value: 'never',
    },
    {
      type: 'radio',
      label: 'Skip',
      value: 'skip',
    },
  ],
  rows: [
    {
      label: 'I was worried money would run out before getting more food',
      key: 'question1',
    },
    {
      label: 'Ran out of food and did not have money to buy more',
      key: 'question2',
    },
    {
      label: 'It was hard to regularly get and eat healthy food',
      key: 'question3',
    },
  ],
};

export const radioGroupTable2: RadioTableQuestion = {
  type: 'radio-table',
  key: 'radio-table-2',
  columns: [
    {
      type: 'radio',
      label: 'Never',
      value: 'never',
    },
    {
      type: 'radio',
      label: '1-3 / month',
      value: '1-3 / month',
    },
    {
      type: 'radio',
      label: '1-2 / week',
      value: '1-2 / week',
    },
    {
      type: 'radio',
      label: '3+ / week',
      value: '3+ / week',
    },
    {
      type: 'radio',
      label: '1 / day',
      value: '1 / day',
    },
    {
      type: 'radio',
      label: '2-3 / day',
      value: '2-3 / day',
    },
    {
      type: 'radio',
      label: '>3 / day',
      value: '>3 / day',
    },
  ],
  rows: [
    {
      label: 'Fruit or 100% fruit juice',
      key: 'question1',
      required: true,
    },
    {
      label: 'Honey or jams',
      key: 'question2',
      disabled: true,
    },
    {
      label: 'Leafy greens & veggies',
      sublabel: 'not potatoes',
      key: 'question3',
    },
    {
      label: 'Potatoes or root veggies',
      sublabel: 'not fried',
      key: 'question4',
      disabled: true,
    },
    {
      label: 'Pizza',
      sublabel: 'including tomato sauce',
      key: 'question5',
    },
    {
      label: 'Tomato based sauces',
      sublabel: 'Salsa, sofrito, etc',
      key: 'question6',
    },
    {
      label: 'Beans and legumes',
      key: 'question7',
    },
    {
      label: 'Whole-grain breads or corn tortillas',
      key: 'question8',
    },
    {
      label: 'Dumplings/cooked dough with filling',
      key: 'question9',
    },
    {
      label: 'Other whole grains',
      key: 'question10',
    },
    {
      label: 'Refined breads',
      key: 'question11',
    },
  ],
};
