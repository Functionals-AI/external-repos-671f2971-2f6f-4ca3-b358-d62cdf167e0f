import { FlowStep } from "../../../types/flow";
import {
  displayPaymentDetailsBlock,
  stateAndTimezoneWorkflowWidget,
} from "../../../reusable-widgets";
import { reasonsList, stateOptions } from "../constants";
import { IContext } from "@mono/common/lib/context";
import { PaymentMethodTypeRecord } from "../../../../payment/store";
import { EmployerId } from "../../../../employer/service";
import { AccountIds } from "@mono/common/lib/account/service";
import _ = require("lodash");

export type ScheduleFlowStepName =
  | "calendar"
  | "payment"
  | "address"
  | "review"
  | "book-appointment"
  | "confirmation"
  // Steps for referral
  | "create-referral"
  | "identity"
  | "referral-review"
  | "referral-confirmation"
  | "referral-payment"
  | "icd10-codes"
  | "appointment-type-id"
  | "additional-info"
  | "schedule_by_selection"
  | "by_time_calendar";

type StepsOptions = {
  paymentMethodTypes: PaymentMethodTypeRecord[]
  isReferral?: boolean;
  accountId?: number;
}

export const getSteps: (
  context: IContext,
  options: StepsOptions
) => Record<
  Exclude<
    ScheduleFlowStepName,
    "review" | "confirmation" | "additional-info"
  >,
  FlowStep
> = (context, options) => {
  const { i18n } = context;

  const paymentMethodTypes = _.groupBy(options.paymentMethodTypes, type => type.method)
  const insuranceList = (paymentMethodTypes['plan'] || [])
    .filter(record => record.insuranceId !== undefined)
    .map((record) => ({
      value: record.insuranceId!,
      label: record.label,
      hidden: record.visible === false
    }));

  const employersList = (paymentMethodTypes['employer'] || [])
    .filter(record => record.employerId !== undefined)
    .filter((record) => options.isReferral ||
      !(
        (record.employerId === EmployerId.MaricopaCounty && options.accountId !== AccountIds.MaricopaCounty) ||
        (record.employerId === EmployerId.IMIAmericas && options.accountId !== AccountIds.IMIAmericas))
      )
      .map((record) => ({
        value: record.employerId!,
        label: record.label,
        hidden: record.visible === false
      }))

  return {
    "appointment-type-id": {
      type: "basic",
      widgets: [
        {
          type: "header-subheader",
          name: "appointment-type-id-header",
          header: i18n.__("What type of virtual visit are you scheduling?"),
        },
        {
          type: "select",
          required: true,
          label: i18n.__("Appointment Type"),
          key: "appointment_type_id",
          options: [
            {
              value: 2,
              label: i18n.__("Initial Visit - 60 minutes (New Members Only)"),
            },
            { value: 3, label: i18n.__("Follow Up - 30 minutes") },
            { value: 221, label: i18n.__("Follow Up - 60 minutes") },
          ],
        },
      ],
    },
    "icd10-codes": {
      type: "basic",
      widgets: [
        {
          type: "header-subheader",
          name: "icd10_codes_header",
          header: i18n.__(
            "Enter reason(s) for Referral (Check all that apply)"
          ),
        },
        {
          type: "two-tiered-list",
          key: "icd10_codes",
          required: true,
          list: Object.entries(reasonsList).reduce(
            (acc, [key, value]) => ({
              ...acc,
              [key]: value.map((v) => ({
                label: v.specificReason,
                value: v.icd10Code,
              })),
            }),
            {}
          ),
        },
      ],
    },
    "referral-payment": {
      type: "basic",
      widgets: [
        {
          type: "header-subheader",
          name: "referral-payment-header",
          header: i18n.__("Patient Payment Information"),
        },
        {
          type: "workflow",
          name: "referral-payment-workflow",
          steps: {
            method_widget: {
              type: "select",
              key: "method",
              label: i18n.__("Is the visit covered by insurance?"),
              required: true,
              options: [
                {
                  value: "plan",
                  label: i18n.__("Yes, by the patient's health insurance"),
                },
              ],
            },
            plan_widget: {
              key: "insurance_id",
              label: i18n.__("Insurance plan"),
              type: "select",
              options: insuranceList,
              required: true,
            },
            member_id_widget: {
              key: "member_id",
              label: i18n.__("Member ID"),
              type: "text",
              required: true,
            },
            group_id_and_member_id_widget: {
              type: "columns",
              name: "group_id_and_member_id_widget_cols",
              widgets: [
                {
                  key: "group_id",
                  label: i18n.__("Group ID"),
                  type: "text",
                  required: true,
                },
                {
                  key: "member_id",
                  label: i18n.__("Member ID"),
                  type: "text",
                  required: true,
                },
              ],
            },
          },
          workflow: {
            start: "ask_method",
            config: {
              ask_method: {
                step: "method_widget",
                next: [
                  {
                    condition: ["notNull", "method"],
                    then: { step: "ask_plan" },
                  },
                ],
              },
              ask_plan: {
                step: "plan_widget",
                next: [
                  {
                    condition: ["numericIn", "insurance_id", [16, 3]], // Aetna or cigna
                    then: { step: "ask_member_group" },
                  },
                  {
                    condition: ["notNull", "insurance_id"],
                    then: { step: "ask_member_id" },
                  },
                ],
              },
              ask_member_id: {
                step: "member_id_widget", // ["member_id"],
              },
              ask_member_group: {
                step: "group_id_and_member_id_widget", // ["group_id", "member_id"],
              },
            },
          },
        },
      ],
    },
    "referral-review": {
      type: "basic",
      widgets: [
        {
          type: "header-subheader",
          name: "referral-review-header",
          header: i18n.__("Review your referral information"),
        },
        {
          type: "data-display",
          name: "referral-review-data-display-1",
          blocks: [
            {
              title: i18n.__("Patient Information"),
              name: "patient-info-block-1",
              cols: 2,
              dataPoints: [
                {
                  type: "value",
                  key: "first_name",
                  label: i18n.__("First Name"),
                },
                {
                  type: "value",
                  key: "last_name",
                  label: i18n.__("Last Name"),
                },
                {
                  type: "value",
                  key: "dob",
                  label: i18n.__("Date of Birth"),
                },
                {
                  type: "value",
                  key: "sex",
                  label: i18n.__("Legal Sex"),
                },
                {
                  type: "value",
                  key: "state",
                  label: i18n.__("State"),
                },
                {
                  type: "value",
                  key: "timezone",
                  label: i18n.__("Timezone"),
                },
                {
                  type: "value",
                  key: "email",
                  label: i18n.__("Email"),
                },
                {
                  type: "value",
                  key: "phone_mobile",
                  label: i18n.__("Mobile Phone"),
                },
              ],
            },
            {
              title: "Patient Address",
              dataPoints: [
                {
                  type: "value",
                  key: "address",
                  label: i18n.__("Address"),
                },
                {
                  type: "value",
                  key: "address2",
                  label: i18n.__("Address 2"),
                },
                {
                  type: "value",
                  key: "address_city",
                  label: i18n.__("City"),
                },
                {
                  type: "value",
                  key: "address_state",
                  label: i18n.__("State"),
                },
                {
                  type: "value",
                  key: "address_zipcode",
                  label: i18n.__("Zip Code"),
                },
              ],
              name: "patient-info-block-2",
              cols: 2,
            },
            displayPaymentDetailsBlock(i18n),
          ],
        },
      ],
    },
    "referral-confirmation": {
      type: "basic",
      widgets: [
        {
          type: "header-subheader",
          name: "referral-confirmation-header",
          header: i18n.__("Your referral has been submitted"),
          subheader: i18n.__(
            "The patient will receive an email with instructions to book their appointment."
          ),
        },
        {
          type: "buttons-options",
          key: "next_button_action",
          buttons: [
            {
              label: i18n.__("Refer Another Patient"),
              value: "refer_another",
            },
            {
              label: i18n.__("Done"),
              value: "done",
            },
          ],
          autoNavigateNextOnClick: true,
        },
      ],
    },
    identity: {
      type: "basic",
      widgets: [
        {
          type: "header-subheader",
          header: i18n.__("Enter Patient's information"),
          name: "patient-identity-header-subheader",
        },
        {
          type: "columns",
          name: "identity-col-1",
          widgets: [
            {
              type: "text",
              label: i18n.__("First Name"),
              key: "first_name",
              required: true,
              max: 100,
            },
            {
              type: "text",
              label: i18n.__("Last Name"),
              key: "last_name",
              required: true,
              max: 100,
            },
          ],
        },
        {
          type: "columns",
          name: "identity-col-2",
          widgets: [
            {
              type: "text:date",
              label: i18n.__("Date of Birth"),
              key: "dob",
              required: true,
            },
            {
              type: "select",
              label: i18n.__("Legal Sex"),
              key: "sex",
              required: true,
              options: [
                { label: i18n.__("Male"), value: "M" },
                { label: i18n.__("Female"), value: "F" },
              ],
            },
          ],
        },
      ],
    },
    address: {
      type: "basic",
      widgets: [
        {
          type: "header-subheader",
          header: i18n.__("Address"),
          subheader: i18n.__(
            "Please provide your address information for booking your visit."
          ),
          name: "address_header_subheader",
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
              key: "address_city",
              label: i18n.__("City"),
              max: 30,
              required: true,
            },
            {
              type: "select",
              key: "address_state",
              label: i18n.__("State"),
              options: stateOptions,
              required: true,
            },
            {
              type: "text:zipcode",
              key: "address_zipcode",
              label: i18n.__("Zipcode"),
              required: true,
            },
          ],
        },
      ],
    },
    payment: {
      type: "custom",
      description: "Select a saved payment method, or add a new one",
      widgets: [
        {
          type: "header-subheader",
          header: i18n.__("Coverage and Payment Details"),
          subheader: i18n.__(
            "Help us understand how you’ll be covering your visit."
          ),
          name: "payment_header",
        },
        {
          type: "workflow",
          name: "payment_workflow",
          steps: {
            method_widget: {
              type: "select",
              key: "method",
              label: i18n.__(
                'Is your visit covered by your health plan or employer?'
              ),
              required: true,
              options: [
                {
                  value: "plan",
                  label: i18n.__("Yes, by my health insurance"),
                },
                {
                  value: "employer",
                  label: i18n.__("Yes, by my employer"),
                },
              ],
            },
            self_pay_disclaimer_widget: {
              type: "p",
              text: i18n.__(
                "For $69/month, the lowest rate on the market, you get a monthly 60 minute dietitian visit and free access to our Foodsmart Premium App. {{payNowLink}} to enter your payment info.  P.S. it will take you to a new page but remember to come back here to complete your visit request. To learn more, give us a call at {{phoneLink}}",
                {
                  payNowLink: `<a target="_blank" href="https://buy.stripe.com/9AQaGe9AT2xsfbGbII">${i18n.__(
                    "Pay Now"
                  )}</a>`,
                  phoneLink:
                    '<a target="_blank" href="tel:844-957-3983">(844) 957-3983</a>',
                }
              ),
              name: "payment_self_pay_disclaimer",
            },
            plan_widget: {
              key: "insurance_id",
              label: i18n.__("Insurance plan"),
              type: "select",
              options: insuranceList,
              required: true,
            },
            employer_widget: {
              key: "employer_id",
              label: i18n.__("Employer"),
              type: "select",
              options: employersList,
              required: true,
            },
            member_id_widget: {
              key: "member_id",
              label: i18n.__("Member ID"),
              type: "text",
              required: true,
            },
            group_id_widget: {
              key: "group_id",
              label: i18n.__("Group ID"),
              type: "text",
              required: true,
            },
            salesforce_plan_widget: {
              key: "insurance_id",
              label: i18n.__("Insurance plan"),
              type: "select",
              options: [
                { label: "Salesforce Employee - Aetna Member", value: 13 },
                { label: "Salesforce Employee - UHC Member", value: 14 },
              ],
              required: true,
            },
            has_umr_plan_widget: {
              key: "insurance_id",
              label: i18n.__("Do you have %s insurance?", "UMR"),
              type: "select",
              options: [
                { label: i18n.__("Yes"), value: 15 },
                { label: i18n.__("No"), value: 0 },
              ],
              required: true,
            },
            arcbest_member_id_widget: {
              key: "member_id",
              label: i18n.__(
                "Provide Your %s Member ID",
                "ArcBest Choice Benefits"
              ),
              type: "text",
              required: true,
            },
            umpquahealth_member_id_widget: {
              key: "member_id",
              label: i18n.__("%s Member ID", "Providence Health Insurance"),
              type: "text",
              required: true,
            },
            aah_member_id_widget: {
              key: "member_id",
              label: i18n.__("Healthy Living ID"),
              type: "text",
              required: true,
            },
            group_id_and_member_id_widget: {
              type: "columns",
              name: "group_id_and_member_id_widget_cols",
              widgets: [
                {
                  key: "group_id",
                  label: i18n.__("Group ID"),
                  type: "text",
                  required: true,
                },
                {
                  key: "member_id",
                  label: i18n.__("Member ID"),
                  type: "text",
                  required: true,
                },
              ],
            },
            adventist_plan_widget: {
              key: "insurance_id",
              label: i18n.__("Insurance plan"),
              type: "select",
              options: [{ label: "Ascend to Wholeness", value: 19 }],
              required: true,
            },
          },
          workflow: {
            start: "ask_method",
            config: {
              ask_method: {
                step: "method_widget",
                next: [
                  {
                    condition: ["stringEquals", "method", "plan"],
                    then: { step: "ask_plan" },
                  },
                  {
                    condition: ["stringEquals", "method", "employer"],
                    then: { step: "ask_employer" },
                  },
                  {
                    condition: ["stringEquals", "method", "self-pay"],
                    then: { step: "show_disclaimer" },
                  },
                ],
              },
              show_disclaimer: {
                step: "self_pay_disclaimer_widget",
              },
              ask_plan: {
                step: "plan_widget",
                next: [
                  {
                    condition: ["numericIn", "insurance_id", [16, 3]], // Aetna or cigna
                    then: { step: "ask_member_group" },
                  },
                  {
                    condition: ["notNull", "insurance_id"],
                    then: { step: "ask_member_id" },
                  },
                ],
              },
              ask_employer: {
                step: "employer_widget", // ["employer"],
                next: [
                  {
                    condition: ["numericEquals", "employer_id", 2], // ArcBest
                    then: { step: "ask_arcbest_member_id" },
                  },
                  {
                    condition: ["numericEquals", "employer_id", 3], // BioMerieux
                    then: { step: "ask_umr_plan" },
                  },
                  {
                    condition: ["numericEquals", "employer_id", 5], // salesforce
                    then: { step: "ask_salesforce_plan" },
                  },
                  {
                    condition: ["numericEquals", "employer_id", 7], // PacificSource
                    then: { step: "ask_member_id" },
                  },
                  {
                    condition: ["numericEquals", "employer_id", 8], // Umpqua Health
                    then: { step: "ask_umpquahealth_member_id" },
                  },
                  {
                    condition: ["numericEquals", "employer_id", 1], // AAH
                    then: { step: "ask_aah_member_id" },
                  },
                  {
                    condition: ["numericEquals", "employer_id", 10], // Adventist Risk Management
                    then: { step: "ask_adventist_plan" },
                  },
                ],
              },
              ask_member_id: {
                step: "member_id_widget", // ["member_id"],
              },
              ask_salesforce_plan: {
                step: "salesforce_plan_widget", //  ["salesforce_plan"],
                next: { step: "ask_member_group" },
              },
              ask_member_group: {
                step: "group_id_and_member_id_widget", // ["group_id", "member_id"],
              },
              ask_umr_plan: {
                step: "has_umr_plan_widget",
                next: [
                  {
                    condition: ["numericEquals", "insurance_id", 15],
                    then: { step: "ask_member_id" },
                  },
                ],
              },
              ask_arcbest_member_id: {
                step: "arcbest_member_id_widget",
              },
              ask_umpquahealth_member_id: {
                step: "umpquahealth_member_id_widget",
              },
              ask_aah_member_id: {
                step: "aah_member_id_widget",
              },
              ask_adventist_plan: {
                step: "adventist_plan_widget",
                next: { step: "ask_member_group" },
              },
            },
          },
        },
      ],
    },
    calendar: {
      type: "custom",
      description: "Show full calendar page where patient schedule",
    },
    "book-appointment": {
      type: "custom",
      description: "Take all data from flow and book appointment",
    },
    "state-and-timezone": {
      type: "basic",
      widgets: [
        {
          type: "header-subheader",
          header: i18n.__("State and Timezone"),
          name: "state-timezone-header-subheader",
        },
        stateAndTimezoneWorkflowWidget(i18n),
      ],
    },
    "email-and-phone": {
      type: "basic",
      widgets: [
        {
          type: "header-subheader",
          name: "email-and-phone-header-subheader",
          header: i18n.__("Enter Email and Phone"),
        },
        {
          type: "text:email",
          label: i18n.__("Email"),
          key: "email",
          required: true,
        },
        {
          type: "text:phone",
          label: i18n.__("Phone"),
          key: "phone_mobile",
          required: false,
        },
      ],
    },
    "create-referral": {
      type: "api",
      path: "/scheduling/referral",
      method: "post",
    },
    "schedule_by_selection": {
      type: 'basic',
      widgets: [
        {
          type: 'header-subheader',
          name: 'schedule_by_selection_header',
          header: i18n.__('How would you like to schedule your visit?'),
        },
        {
          type: 'select',
          key: 'scheduleByType',
          required: true,
          options: [
            { label: i18n.__('Select a time'), value: 'time' },
            { label: i18n.__('Select a dietitian'), value: 'provider' },
          ]
        }
      ]
    },
    "by_time_calendar": {
      type: 'custom',
      description: 'Show calendar page where patient can select time, provider agnostic',
    }
  };
};
