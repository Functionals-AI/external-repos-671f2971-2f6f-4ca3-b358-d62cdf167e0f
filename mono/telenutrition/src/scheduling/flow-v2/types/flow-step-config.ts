import { Condition } from './condition';

export type FlowStepThen<FlowStepName = string> = {
  step: FlowStepName;
  customAnalyticsEvent?: CustomAnalyticsEvent;
};

export type CustomAnalyticsEvent = {
  name: string;
  type: string;
};

export type FlowStepNextRedirectAction = {
  action: "REDIRECT";
  toUrl:
    | string
    | {
        condition?: Condition;
        then: string;
      }[];
  query?: {
    // Key of value in the flow
    flowKey: string;
    // keyname when putting in query param
    asKey: string;
  }[];
  customAnalyticsEvent?: CustomAnalyticsEvent;
};

type FlowStepNextLogoutAndRedirect = {
  action: "LOGOUT_AND_REDIRECT";
  toUrl: string;
  customAnalyticsEvent?: CustomAnalyticsEvent;
};

export type FlowStepNextBasicConfig<FlowStepName = string> =
  | {
      step: FlowStepName;
      customAnalyticsEvent?: CustomAnalyticsEvent;
    }
  | {
      // does not create new flow session
      action: "RESET_AND_RESTART";
      customAnalyticsEvent?: CustomAnalyticsEvent;
    }
  | FlowStepNextRedirectAction
  | FlowStepNextLogoutAndRedirect
  | {
      // does create new flow session
      action: "CREATE_NEW_FLOW";
      customAnalyticsEvent?: CustomAnalyticsEvent;
    };

export interface FlowStepNextConditionConfig<FlowStepName = string> {
  condition?: Condition;
  then: FlowStepNextBasicConfig<FlowStepName>;
}

export type FlowStepNextConfig<FlowStepName = string> =
  | FlowStepNextBasicConfig<FlowStepName>
  | FlowStepNextConditionConfig<FlowStepName>[];

export function isStepNextConfigBasic(
  stepNextConfig: FlowStepNextConfig
): stepNextConfig is FlowStepNextBasicConfig {
  return "step" in stepNextConfig || "action" in stepNextConfig;
}

export type FlowStepConfig<FlowStepName = string> = {
  step: FlowStepName;
  next: FlowStepNextConfig<FlowStepName>;
  maxRemainingSteps: number;
  footerConfig?: FlowStepFooterConfig;
};

export type FlowStepFooterConfig = {
  hide?: boolean;
  backButton?: {
    hide?: boolean;
    text?: string;
  };
  nextButton?: {
    hide?: boolean;
    text?: string;
  };
};
