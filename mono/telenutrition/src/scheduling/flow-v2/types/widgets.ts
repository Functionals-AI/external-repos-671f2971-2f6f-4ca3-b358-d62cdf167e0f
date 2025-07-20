import { Condition } from './condition';

export type TextSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

export type FlowWidgetType =
  | "header-subheader"
  | "p"
  | "html"
  | "select"
  | "conditional-select"
  | "custom-list-select"
  | "button"
  | "text"
  | "text:date"
  | "text:phone"
  | "text:zipcode"
  | "text:email"
  | "columns"
  | "workflow"
  | "data-display"
  | "two-tiered-list"
  | "buttons-options"
  | "hr"
  | "single-checkbox";

// "name" is a fallback for widgets without a key. A "key" implies the widget
// will have a value mapped to the key. "name" is simply for react to render
// the item with a unique value.
export type FlowWidgetBaseWithName<T extends FlowWidgetType> = {
  type: T;
  name: string;
};
export type FlowWidgetBaseWithKey<T extends FlowWidgetType> = {
  type: T;
  key: string;
};

export type FlowWidgetBase<T extends FlowWidgetType> = {
  condition?: Condition;
} & (FlowWidgetBaseWithName<T> | FlowWidgetBaseWithKey<T>);

export type HeaderSubheaderWidget = FlowWidgetBase<"header-subheader"> & {
  header: string;
  subheader?: string;

  // default is 3xl
  headerSize?: TextSize;
};

export type ParagraphWidget = FlowWidgetBase<"p"> & {
  text: string;
};

export type HTMLWidgetFlows = FlowWidgetBase<"html"> & {
  html: string;
};

export type InputWidget = FlowWidgetBase<
  "text" | "text:date" | "text:email" | "text:phone" | "text:zipcode"
> & {
  key: string;
  label?: string | null;
  required?: boolean;
  max?: number;
};

export type SelectWidget = FlowWidgetBase<"select"> & {
  options: { value: number | string | boolean; label: string; hidden?: boolean }[];
  required?: boolean;
  key: string;
  label?: string | null;
};

// Allow custom rendering for list elements
export type CustomListSelectWidget = FlowWidgetBase<"custom-list-select"> & {
  options: { value: number | string | boolean; display: FlowWidget[] }[];
  // Display each item in a card
  renderInCard: boolean;
  required?: boolean;
  key: string;
  label?: string | null;
  // Default 1 column
  cols?: number;
};

export type ConditionalSelectWidget = FlowWidgetBase<"conditional-select"> & {
  options: {
    condition: Condition;
    then: { value: number | string | boolean; label: string };
  }[];
  required?: boolean;
  key: string;
  label?: string | null;
};

export type ColumnsWidget = FlowWidgetBase<"columns"> & {
  // Default to span 1
  widgets: ({ span?: number } & FlowWidget)[];
};

type WorkflowId = string;
export type WorkflowWidget = FlowWidgetBase<"workflow"> & {
  steps: Record<WorkflowId, Exclude<FlowWidget, WorkflowWidget>>;
  workflow: {
    start: WorkflowId;
    config: Record<
      WorkflowId,
      {
        step: string;
        next?:
          | { step: WorkflowId }
          | { condition?: Condition; then: { step: WorkflowId } }[];
      }
    >;
  };
};

type DataPointDisplayBase = {
  label?: string | null;
} & ({ key: string } | { name: string });

// Display user's data obtained from the flow
export type DataPointDisplay = DataPointDisplayBase &
  (
    | {
        type: "value";
        key: string;
      }
    | {
        type: "text";
        text: string;
      }
    | {
        type: "image";
        key: string;
        alt: string;
        fallback:
          | {
              type: "text";
              value: string;
            }
          | {
              type: "value";
              key: string;
            };
      }
    | {
        type: "html";
        name: string;
        html: string;
      }
    | {
        type: "date";
        key: string;
        format: string;
      }
  );

export type DataDisplayBlock = {
  title?: string;
  dataPoints: DataPointDisplay[];
  name: string;
  cols: number;
};

export type DataDisplayWidgetFlows = FlowWidgetBase<"data-display"> & {
  blocks: DataDisplayBlock[];
};

export type TwoTieredListWidget = FlowWidgetBase<"two-tiered-list"> & {
  key: string;
  label?: string | null;
  required?: boolean;
  list: Record<string, { value: string; label: string }[]>;
};

export type ButtonOptionsWidget = FlowWidgetBase<"buttons-options"> & {
  key: string;
  buttons: {
    value: string | true;
    label: string;
  }[];
  // If true, auto-trigger handleNext function for the step
  autoNavigateNextOnClick?: boolean;
};

export type HrWidget = FlowWidgetBase<"hr"> & {
  color: string;
  // pixels
  height: number;
};

export type SingleCheckboxWidgetFlows = FlowWidgetBase<"single-checkbox"> & {
  key: string;
  label: string;
  value: string;
  defaultChecked?: boolean | Condition;
  overview?: string;
  required?: boolean;
};

export type FlowWidget =
  | HeaderSubheaderWidget
  | ParagraphWidget
  | InputWidget
  | SelectWidget
  | ConditionalSelectWidget
  | ColumnsWidget
  | WorkflowWidget
  | DataDisplayWidgetFlows
  | TwoTieredListWidget
  | ButtonOptionsWidget
  | HrWidget
  | SingleCheckboxWidgetFlows
  | CustomListSelectWidget
  | HTMLWidgetFlows;
