export type AndCondition = ['and', Condition[]];
export type OrCondition = ['or', Condition[]];
export type StringInCondition = ['stringIn', string, string[]];
export type StringEqualsCondition = ['stringEquals', string, string];
export type BooleanEqualsCondition = ['booleanEquals', string, boolean];
export type NumericEqualsCondition = ['numericEquals', string, number];
export type NumericInCondition = ['numericIn', string, number[]];
export type NotNullCondition = ['notNull', string];

export type Condition =
  | StringInCondition
  | StringEqualsCondition
  | AndCondition
  | OrCondition
  | BooleanEqualsCondition
  | NumericEqualsCondition
  | NumericInCondition
  | NotNullCondition;