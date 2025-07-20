import { Condition } from '../flow-v2/types/condition';

export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export type GroupWidget = {
  type: 'group';
  title: string;
  subtitle?: string;
  groupKey: string;
  widgets: Widget[];
};

export interface DataDisplayWidget {
  type: 'data-display';
  name: string;
  label: string;
  content: string;
}

export interface PrevAnswerWidget {
  prevAnswerPrompt?: 'readonly' | 'fillable';
  prevAnswerPromptLocation?: 'parent';
}

export type QuestionWidgetBase = {
  key: string;

  // Top-level question label, bold (not inside input)
  label?: string;
  sublabel?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  size?: WidgetSize;
  hideBottomBorder?: boolean;
} & PrevAnswerWidget;

// Deprecate
export type GridWidget = {
  type: 'grid';
  name: string;
  title?: string;
  colSpan: number;
  cols: {
    span: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    widget: Exclude<Widget, GridWidget>;
  }[];
};

export type FlexRowWidget = {
  type: 'flex-row';
  name: string;
  title?: string;
  maxSize: WidgetSize;
  // Remove size?
  widgets: { size: WidgetSize; widget: Exclude<Widget, FlexRowWidget> & PrevAnswerWidget }[];
};

export type RadioGroupTieredOption = RadioGroupTieredBasicOption | RadioGroupTieredTextInputOption;

type RadioGroupTieredBasicOption = {
  type: 'basic';
  value: string;
  label: string;
  sublabel?: string;
  disabled?: boolean;
};

type RadioGroupTieredTextInputOption = {
  type: 'text-input';
  value: string;
  label: string;
  placeholder?: string;
  disabled?: boolean;
};

export interface RadioGroupTieredQuestion extends QuestionWidgetBase {
  type: 'input:radio';
  options: RadioGroupTieredOption[];
}

export type RadioGroupV2Option = RadioGroupV2BasicOption | RadioGroupV2ComboboxOption;

export type RadioGroupV2BasicOption = {
  type?: 'basic';
  value: string;
  label: string;
  sublabel?: string;
  disabled?: boolean;
};

export type RadioGroupV2ComboboxOption = {
  type: 'combobox';
  // This value shouldn't ever be sent as the answer to the question but is used to display the combobox
  value: string;
  label: string;
  inputLabel: string;
  sublabel?: string;
  disabled?: boolean;
  placeholder?: string;
  options: { label: string; value: string }[];
};

export interface RadioGroupV2Question extends QuestionWidgetBase {
  type: 'input:radio-v2';
  options: RadioGroupV2Option[];
}

export interface PhoneInputQuestion extends QuestionWidgetBase {
  type: 'input:phone';
  inputLabel: string;
}

export interface RadioTableRow {
  key: string;
  label: string;
  required?: boolean;
  sublabel?: string;
  disabled?: boolean;
}

export type RadioTableColumn = {
  type: 'radio';
  value: string;
  label: string;
};

export interface RadioTableQuestion extends QuestionWidgetBase {
  type: 'radio-table';
  columns: RadioTableColumn[];
  rows: RadioTableRow[];
}

export interface NumberInputQuestion extends QuestionWidgetBase {
  type: 'input:number';
  inputLabel: string;
  min?: number;
  max?: number;
  allowScroll?: boolean;
  defaultValue?: number;
  decimalScale?: number;
}

export interface TextInputQuestion extends QuestionWidgetBase {
  type: 'input:text';
  defaultValue?: string;
  inputLabel: string;
  placeholder?: string;
}

export interface DateInputQuestion extends QuestionWidgetBase {
  type: 'input:date';
  inputLabel: string;
  // ISO
  max?: string;
  // ISO
  min?: string;
}

export interface TimeInputQuestion extends QuestionWidgetBase {
  type: 'input:time';
  inputLabel: string;
}

export interface InlineInputs {
  type: 'inline-inputs';
  name: string;
  label: string;
  inputs: (Omit<NumberInputQuestion, 'label'> | Omit<TextInputQuestion, 'label'> | Omit<DateInputQuestion, 'label'>)[];
}

interface TextAreaQuestion extends QuestionWidgetBase {
  type: 'input:textarea';
  inputLabel: string;
}

export interface SelectQuestion extends QuestionWidgetBase {
  type: 'input:select';
  inputLabel: string;
  options: SelectQuestionOption[];
}

export type SelectQuestionBasicOption = {
  type?: 'basic';
  label: string;
  value: string;
  disabled?: boolean;
};

export type SelectQuestionOption =
  | SelectQuestionBasicOption
  | {
      type: 'group';
      groupLabel: string;
      options: SelectQuestionBasicOption[];
    };

export type ComboboxQuestionBasicOption = {
  type?: 'basic';
  label: string;
  value: string;
  disabled?: boolean;
};

export type ComboBoxConditionalOption = {
  type: 'conditional';
  conditions: Condition[];
  then: { options: ComboboxQuestionBasicOption[] };
};

export type ComboboxGroupOption = {
  type: 'group';
  groupLabel: string;
  options: ComboboxQuestionBasicOption[];
};

export type ComboboxQuestionOption = ComboboxQuestionBasicOption | ComboboxGroupOption | ComboBoxConditionalOption;

export interface ComboboxInputQuestion extends QuestionWidgetBase {
  type: 'input:combobox';
  inputLabel: string;
  options: ComboboxQuestionOption[];
  placeholder?: string;
  // default false
  disableAutoComplete?: boolean;
}

// can give keys surrounded by {{}}
type InterpolationTextStringType =
  | {
      type: 'text';
      key: string;
    }
  | {
      type: 'date';
      key: string;
      format: string;
    }
  | {
      type: 'time';
      key: string;
      timezone: string;
      format: string;
    }
  | {
      type: 'date-diff';
      key1: string;
      key2: string;
    };

export type InterpolatableTextString = {
  // "Hello {{name}}, today is {{date}}"
  text: string;
  // { name: { type: 'text' }, date: { type: 'date', format: 'MM/DD/YYYY' } }
  interpolate: Record<string, InterpolationTextStringType>;
};

export interface TableQuestion extends QuestionWidgetBase {
  type: 'table';
  addEntryModal: {
    title: string;
    widgets: QuestionWidget[];
  };
  renderEntryConfig: {
    label: InterpolatableTextString;
    sublabel: InterpolatableTextString;
  };
  tableLabel: string;
}

export type ConditionalWidget = {
  type: 'conditional';
  name: string;
  conditions: Condition[];
  widgets: Exclude<Widget, ConditionalWidget>[];
};

export interface MultipleSelectQuestion extends QuestionWidgetBase {
  type: 'multi-select';
  options: { label: string; value: string; disabled?: boolean }[];
}

// Deprecated
export interface TagInputWidgetOption {
  type: 'predefined';
  label: string;
  value: string;
  disabled?: boolean;
}

// Deprecated
export interface TagInputQuestion extends QuestionWidgetBase {
  type: 'tag-input';
  options: TagInputWidgetOption[];
  creatable?: boolean;
  inputLabel: string;
  placeholder?: string;
}

export interface TagInputQuestionV2Option {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface TagInputQuestionV2 extends QuestionWidgetBase {
  type: 'tag-input-v2';
  inputLabel: string;
  placeholder?: string;
  options: TagInputQuestionV2Option[];
}

export interface AlertBoxMessageQuestion extends QuestionWidgetBase {
  type: 'alert-box-message';
  variant: 'warn';
  title: string;
  subtitle?: string;
  expanderLabel: string;
  // HTML
  expanderContent: string;
}

export interface NoticeMessageWidget {
  type: 'notice-message';
  name: string;
  variant: 'info';
  title: string;
  message: string;
}

export interface EntryEditorQuestion extends QuestionWidgetBase {
  type: 'entry-editor';
  addButtonText: string;
  inputLabel: string;
  allowEmptyEntries?: boolean;
  min?: number;
  max?: number;
  options: {
    label: string;
    value: string;
  }[];
}

export interface RichTextQuestion extends QuestionWidgetBase {
  type: 'rich-text';
}

// Shows no = NULL, and yes = shows options tag input
export interface ConditionalTagInputQuestion extends QuestionWidgetBase {
  type: 'conditional-tag-input';
  options: TagInputQuestionV2Option[];
  inputLabel: string;
  placeholder?: string;
}

export interface QuestionsWithDateWidget extends QuestionWidgetBase {
  type: 'questions-with-date';
  question: Omit<NumberInputQuestion, 'key' | 'isPatientAttribute'>;
  defaultDate?: string; // ISO
  minDate?: string; // ISO
  maxDate?: string; // ISO
  dateInputLabel: string;
  showHistoricalValues?: boolean;
}

export interface SingleCheckboxWidget extends QuestionWidgetBase {
  type: 'single-checkbox';
  checkboxLabel: string;
}

interface Option {
  label: string;
  value: string;
}

interface TieredComboBoxInputQuestion {
  type: 'tiered-combobox';
  key: string;
  inputLabel: string;
  required?: boolean;
  props: { condition?: Condition; then: { options: Option[] } }[];
}

interface TieredTextAreaInputQuestion {
  type: 'tiered-textarea';
  key: string;
  inputLabel: string;
  required?: boolean;
  props: { condition?: Condition; then: { label: string } }[];
}

type TieredInput = TieredComboBoxInputQuestion | TieredTextAreaInputQuestion;

export interface TieredInputsQuestion extends QuestionWidgetBase {
  type: 'tiered-inputs';
  inputs: TieredInput[];
}

export interface HTMLWidget {
  type: 'html';
  name: string;
  html: InterpolatableTextString;
}

export type Widget =
  | SelectQuestion
  | TextAreaQuestion
  | InlineInputs
  | TableQuestion
  | NumberInputQuestion
  | TextInputQuestion
  | DateInputQuestion
  | RadioGroupTieredQuestion
  | RadioTableQuestion
  | GridWidget
  | ConditionalWidget
  | MultipleSelectQuestion
  | TagInputQuestion
  | AlertBoxMessageQuestion
  | GroupWidget
  | NoticeMessageWidget
  | TimeInputQuestion
  | EntryEditorQuestion
  | RichTextQuestion
  | RadioGroupV2Question
  | PhoneInputQuestion
  | DataDisplayWidget
  | TagInputQuestionV2
  | QuestionsWithDateWidget
  | SingleCheckboxWidget
  | ConditionalTagInputQuestion
  | FlexRowWidget
  | TieredInputsQuestion
  | HTMLWidget
  | ComboboxInputQuestion;

export type QuestionWidget = Extract<Widget, QuestionWidgetBase>;

export function isQuestionWidget(widget: Widget): widget is QuestionWidget {
  return 'key' in widget;
}

export type QuestionnaireDisplayValue =
  | { type: 'group'; title: string; groupKey: string; children: QuestionnaireDisplayValue[] }
  | {
      type: 'text';
      question: string;
      text?: string;
      bullets?: string[];
    }
  | { type: 'single-checkbox'; label: string; value: boolean };
