import {
  ColumnsWidget,
  DataDisplayBlock,
  DataDisplayWidgetFlows,
  WorkflowWidget,
} from "./types/widgets";
import { I18n } from "i18n";
import { stateOptions, statesWithTimezone } from "./flows/schedule/constants";

export const displayPaymentDetailsBlock: (i18n: I18n) => DataDisplayBlock = (
  i18n
) => ({
  title: i18n.__("Coverage and Payment Details"),
  name: "review_data_display_block_5",
  cols: 2,
  dataPoints: [
    {
      type: "value",
      key: "method",
      label: i18n.__("Payment Method"),
    },
    {
      type: "value",
      key: "employer_id",
      label: i18n.__("Employer"),
    },
    {
      type: "value",
      key: "member_id",
      label: i18n.__("Member ID"),
    },
    {
      type: "value",
      key: "insurance_id",
      label: i18n.__("Insurance Plan"),
    },
    {
      type: "value",
      key: "group_id",
      label: i18n.__("Group ID"),
    },
  ],
});

export const displayPersonalInfoForBookingDataWidget: (
  i18n: I18n
) => DataDisplayWidgetFlows = (i18n) => ({
  type: "data-display",
  name: "referral_confirmation_data_display_1",
  blocks: [
    {
      title: i18n.__("Primary Details"),
      name: "referral_confirmation_data_display_block_1",
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
      ],
    },
    {
      title: "Contact Details",
      name: "referral_confirmation_data_display_block_2",
      cols: 2,
      dataPoints: [
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
        {
          type: "value",
          key: "phone_home",
          label: i18n.__("Home Phone"),
        },
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
          label: i18n.__("Zipcode"),
        },
      ],
    },
    displayPaymentDetailsBlock(i18n),
  ],
});

export const displayAppointmentDataWidget: (i18n: I18n) => ColumnsWidget = (
  i18n
) => ({
  type: "columns",
  name: "reveiw_cols_1_col_1",
  widgets: [
    {
      span: 1,
      type: "data-display",
      name: "review_data_display_1",
      blocks: [
        {
          name: "review_data_display_block_1",
          cols: 1,
          dataPoints: [
            {
              key: "appointment.provider_photo",
              type: "image",
              alt: i18n.__("Provider image"),
              fallback: { type: "value", key: "appointment.provider_initials" },
            },
            {
              type: "value",
              key: "appointment.provider_name",
            },
          ],
        },
      ],
    },
    {
      span: 2,
      type: "data-display",
      name: "review_data_display_2",
      blocks: [
        {
          name: "review_data_display_block_2",
          cols: 2,
          dataPoints: [
            {
              type: "html",
              html: `<h3 style="font-size: 20px; font-weight: 700;">${i18n.__(
                "Visit Details"
              )}</h3>`,
              name: "visit_details",
            },
            {
              type: "date",
              label: i18n.__("Date"),
              key: "appointment.start_timestamp",
              format: "LL",
            },
            {
              type: "value",
              label: i18n.__("Time"),
              key: "appointment.start_at",
            },
            {
              type: "text",
              name: "duration",
              label: i18n.__("Duration"),
              text: "{{appointment.duration}} minutes",
            },
          ],
        },
      ],
    },
  ],
});

export const stateAndTimezoneWorkflowWidget = (
  i18n: I18n,
  required: boolean = true
): WorkflowWidget => ({
  type: "workflow",
  name: "state-timezone-workflow",
  steps: {
    state: {
      type: "select",
      key: "state",
      label: i18n.__("State"),
      required: required,
      options: stateOptions,
    },
    timezone: {
      type: "conditional-select",
      key: "timezone",
      label: i18n.__("Timezone"),
      required: required,
      options: [
        {
          condition: [
            "stringIn",
            "state",
            ["AL", "FL", "IN", "KS", "KY", "MI", "NE", "ND", "SD", "TN", "TX"],
          ],
          then: {
            value: "US/Central",
            label: i18n.__("%s Timezone", "Central"),
          },
        },
        {
          condition: [
            "stringIn",
            "state",
            ["AL", "FL", "IN", "KY", "MI", "TN"],
          ],
          then: {
            value: "US/Eastern",
            label: i18n.__("%s Timezone", "Eastern"),
          },
        },
        {
          condition: ["stringIn", "state", ["AZ"]],
          then: {
            value: "US/Arizona",
            label: i18n.__("%s Timezone", "Arizona"),
          },
        },
        {
          condition: [
            "stringIn",
            "state",
            ["AZ", "ID", "KS", "NE", "NV", "ND", "OR", "SD", "TX"],
          ],
          then: {
            value: "US/Mountain",
            label: i18n.__("%s Timezone", "Mountain"),
          },
        },
        {
          condition: ["stringIn", "state", ["ID", "NV", "OR"]],
          then: {
            value: "US/Pacific",
            label: i18n.__("%s Timezone", "Pacific"),
          },
        },
        {
          condition: ["stringEquals", "state", "AK"],
          then: {
            value: "US/Alaska",
            label: i18n.__("%s Timezone", "Alaska"),
          },
        },
        {
          condition: ["stringEquals", "state", "AK"],
          then: {
            value: "US/Aleutian",
            label: i18n.__("%s Timezone", "Aleutian"),
          },
        },
      ],
    },
  },
  workflow: {
    start: "state",
    config: {
      state: {
        step: "state",
        next: [
          {
            condition: ["stringIn", "state", statesWithTimezone],
            then: { step: "timezone" },
          },
        ],
      },
      timezone: {
        step: "timezone",
      },
    },
  },
});
