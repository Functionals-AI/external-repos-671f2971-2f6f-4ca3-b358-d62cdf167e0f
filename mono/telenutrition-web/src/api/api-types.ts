import type { Condition } from '@mono/telenutrition/lib/types';

export interface QuestionOption {
  value: string | number | boolean;
  label: string;
}

export interface QuestionConditionsOption {
  condition: Condition;
  then: QuestionOption;
}

export type QuestionId = string;
export type QuestionWidgetType =
  | 'select'
  | 'button'
  | 'text'
  | 'text:date'
  | 'text:phone'
  | 'text:zipcode'
  | 'text:email';

interface QuestionDisclaimerCondition {
  condition: Condition;
  then: string;
}

export function isQuestionDisclaimerCondition(
  disclaimer: QuestionDisclaimer,
): disclaimer is QuestionDisclaimerCondition {
  return typeof disclaimer === 'object';
}

export type QuestionDisclaimer = string | QuestionDisclaimerCondition;

interface QuestionConfigBase {
  widget: QuestionWidgetType;
  label: string;
  default?: string | number | boolean;
  order?: [number, number];
  required?: boolean;
  max?: number;
  key: string;
  disabled?: boolean;
  // If a question needs to show a disclaimer below the input, it can show a plain string or
  // conditionally show a string based on the user's answer.
  disclaimer?: QuestionDisclaimer;
}

type BasicQuestionConfig = QuestionConfigBase & {
  widget: Exclude<QuestionWidgetType, 'select' | 'button'>;
};

type QuestionConfigWithOptions = QuestionConfigBase & {
  widget: Extract<QuestionWidgetType, 'select' | 'button'>;
  options: (QuestionOption | QuestionConditionsOption)[];
};

export type QuestionConfig = QuestionConfigWithOptions | BasicQuestionConfig;

export interface QuestionGroupConfig extends TitleConfig {
  questions: Record<QuestionId, QuestionConfig>;
  order?: number;
  label?: string;
  requiredAnyOf?: string[];
}

export type QuestionGroupConfigWithWorkflow = QuestionGroupConfig & {
  workflow: WorkflowConfig;
};

export type StateId = string;
export type GroupId = string;

export interface StateCondition {
  condition?: Condition;
  then: StateId;
}

export interface WorkflowState {
  questions: QuestionId[];
  next?: StateId | StateCondition[]; // End of flow if next is undefined
}

export interface WorkflowConfig {
  start: StateId;
  states: Record<StateId, WorkflowState>;
}

interface TitleConfig {
  title: string;
  subtitle: string;
}
