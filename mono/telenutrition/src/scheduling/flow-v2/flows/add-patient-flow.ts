import { IContext } from "@mono/common/src/context";
import { Flow } from "../types/flow";
import { stateAndTimezoneWorkflowWidget } from "../reusable-widgets";

type AddPatientFlowStep = "additional-info" | "contact-info" | "post-patients";

// export interface GetAddMeFlowOptions {
//   hideStateQuestion?: boolean;
// }

export function getAddPatientFlow(
  context: IContext
  // options: GetAddMeFlowOptions
): Flow<AddPatientFlowStep> {
  const { i18n } = context;

  const flow: Flow<AddPatientFlowStep> = {
    steps: {
      "additional-info": {
        type: "basic",
        widgets: [
          {
            type: "header-subheader",
            header: i18n.__("Add information for patient"),
            subheader: i18n.__(
              "This patient will automatically be added to your user account."
            ),
            name: "additional-info-header-subheader",
          },
          {
            type: "text",
            key: "firstName",
            label: i18n.__("First Name"),
            required: true,
          },
          {
            type: "text",
            key: "lastName",
            label: i18n.__("Last Name"),
            required: true,
          },
          {
            type: "text:date",
            key: "dob",
            label: i18n.__("Birthday"),
            required: true,
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
          {
            type: "text:phone",
            key: "phoneMobile",
            label: i18n.__("Phone"),
            required: true,
          },
          {
            type: "text:email",
            key: "email",
            label: i18n.__("Email"),
          },
        ],
      },
      // TODO: temp until update api enabled in Athena
      "contact-info": {
        type: "basic",
        widgets: [
          {
            type: "header-subheader",
            header: i18n.__("Add information for patient"),
            subheader: i18n.__(
              "This patient will automatically be added to your user account."
            ),
            name: "contact-info-header-subheader",
          },
          {
            type: "columns",
            name: "contact_address_cols",
            widgets: [
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
            ],
          },
          {
            type: "columns",
            name: "contact_address_cols_2",
            widgets: [
              {
                type: "text",
                key: "city",
                label: i18n.__("City"),
                max: 30,
                required: true,
              },
              {
                type: "text:zipcode",
                key: "zipcode",
                label: i18n.__("Zipcode"),
                required: true,
              },
            ],
          },
          stateAndTimezoneWorkflowWidget(i18n),
        ],
      },
      "post-patients": {
        type: "custom",
        description: "Add the patient, prompting for enrollment challenge if required",
      },
    },
    workflow: {
      start: { step: "additional-info" },
      maxTotalSteps: 3,
      config: {
        "additional-info": {
          step: "additional-info",
          next: { step: "contact-info" },
          maxRemainingSteps: 2,
        },
        "contact-info": {
          step: "contact-info",
          next: { step: "post-patients" },
          maxRemainingSteps: 1,
        },
        "post-patients": {
          maxRemainingSteps: 0,
          step: "post-patients",
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
