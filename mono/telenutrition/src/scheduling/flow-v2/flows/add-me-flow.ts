import { IContext } from "@mono/common/src/context";
import { Flow } from "../types/flow";
import { stateAndTimezoneWorkflowWidget } from "../reusable-widgets";

type AddMeFlowStep = "additional-info" | "post-patients-me";

export interface GetAddMeFlowOptions {
  hideStateQuestion?: boolean;
}

export function getAddMeFlow(
  context: IContext,
  options: GetAddMeFlowOptions
): Flow<AddMeFlowStep> {
  const { i18n } = context;

  const flow: Flow<AddMeFlowStep> = {
    steps: {
      "additional-info": {
        type: "basic",
        widgets: [
          {
            type: "header-subheader",
            header: i18n.__("Tell us more about you"),
            subheader: i18n.__(
              "Please enter additional information to help us match you with a dietitian."
            ),
            name: "additional-info-header-subheader",
          },
          {
            type: "text:phone",
            key: "phoneMobile",
            label: i18n.__("Phone"),
            required: true,
          },
          {
            type: "text:email",
            required: false,
            label: i18n.__("Email"),
            key: "email",
          },
          {
            type: "select",
            key: "sex",
            label: i18n.__("Sex"),
            required: true,
            options: [
              { label: i18n.__("Male"), value: "M" },
              { label: i18n.__("Female"), value: "F" },
            ],
          },
          // TODO: temp until update api enabled in Athena
          {
            type: "text",
            key: "address",
            label: i18n.__("Address"),
            required: true,
            max: 100,
          },
          {
            type: "text",
            key: "address2",
            label: i18n.__("Address 2"),
            required: false,
            max: 100,
          },
          {
            type: "text",
            key: "city",
            label: i18n.__("City"),
            max: 30,
            required: true,
          },
          ...(!options.hideStateQuestion
            ? [stateAndTimezoneWorkflowWidget(i18n)]
            : []),
        ],
      },
      "post-patients-me": {
        type: "api",
        method: "post",
        path: "/scheduling/patients/me",
      },
    },
    workflow: {
      start: { step: "additional-info" },
      maxTotalSteps: 2,
      config: {
        "additional-info": {
          step: "additional-info",
          next: { step: "post-patients-me" },
          maxRemainingSteps: 1,
        },
        "post-patients-me": {
          maxRemainingSteps: 0,
          step: "post-patients-me",
          next: {
            action: "REDIRECT",
            toUrl: "/schedule/flow/schedule",
            query: [{ flowKey: "patientId", asKey: "patient_id" }],
          },
        },
      },
    },
  };

  return flow;
}
