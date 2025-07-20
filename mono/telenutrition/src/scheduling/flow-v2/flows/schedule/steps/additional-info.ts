import { IContext } from "@mono/common/src/context";
import { FlowBasicStep } from "../../../types/flow";
import { FlowWidget } from "../../../types/widgets";
import { stateAndTimezoneWorkflowWidget } from "../../../reusable-widgets";

type AdditionalFieldWidgetKey =
  | "state-and-timezone"
  | "email"
  | "phone"
  | "zipcode";

type AdditionalInfoWidgetConfig = {
  key: AdditionalFieldWidgetKey;
  required: boolean;
};

interface GetAdditionalInfoStepOptions {
  header?: string;
  subheader?: string;
  widgetConfigs: AdditionalInfoWidgetConfig[];
}

export const getAdditionalInfoStep = (
  context: IContext,
  options: GetAdditionalInfoStepOptions
): FlowBasicStep => {
  const { i18n } = context;

  return {
    type: "basic",
    widgets: [
      {
        type: "header-subheader",
        name: "additional-fields-header",
        header:
          options.header ?? i18n.__("Please enter additional information"),
        subheader: options.subheader,
      },
      ...mapKeysToWidgets(context, options.widgetConfigs),
    ],
  };
};

function mapKeysToWidgets(
  context: IContext,
  widgetConfigs: AdditionalInfoWidgetConfig[]
): FlowWidget[] {
  const { i18n } = context;

  return widgetConfigs
    .map(({ key, required }) => {
      if (key === "email") {
        return {
          type: "text:email",
          label: i18n.__("Email"),
          key: "email",
          required: required,
        };
      }
      if (key === "phone") {
        return {
          type: "text:phone",
          label: i18n.__("Phone"),
          key: "phone_mobile",
          required: required,
        };
      }
      if (key === "state-and-timezone") {
        return stateAndTimezoneWorkflowWidget(i18n, required);
      }
      if (key === "zipcode") {
        return {
          type: "text:zipcode",
          key: "address_zipcode",
          label: i18n.__("Zipcode"),
          required: required,
        };
      }

      return null;
    })
    .filter((w) => !!w) as FlowWidget[];
}
