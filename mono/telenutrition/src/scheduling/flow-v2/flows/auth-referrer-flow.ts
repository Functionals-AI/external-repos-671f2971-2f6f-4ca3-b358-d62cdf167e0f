import { IContext } from "@mono/common/src/context";
import { Flow } from "../types/flow";
import { referrerOrganizations } from "./schedule/constants";

type AuthReferrerFlowStep =
  | "create_referrer"
  | "post_auth_referrer"
  | "sync_or_async";

export interface GetAuthReferrerFlowOptions {
  firstStep: Extract<AuthReferrerFlowStep, "create_referrer" | "sync_or_async">;
  flowType: string;
}

export function getAuthReferrerFlow(
  context: IContext,
  options: GetAuthReferrerFlowOptions
): Flow<AuthReferrerFlowStep> {
  const { i18n } = context;

  const flow: Flow<AuthReferrerFlowStep> = {
    steps: {
      create_referrer: {
        type: "basic",
        widgets: [
          {
            type: "header-subheader",
            header: i18n.__("Please enter Referrer Information"),
            name: "create-referrer-header-subheader",
          },
          {
            type: "columns",
            name: "create_referrer_cols_1",
            widgets: [
              {
                type: "text",
                label: i18n.__("Referrer's First Name"),
                key: "firstName",
                required: true,
              },
              {
                type: "text",
                label: i18n.__("Referrer's Last Name"),
                key: "lastName",
                required: true,
              },
              options.flowType === "referrer" ? {
                type: "text",
                label: i18n.__("Referrer's Credentials"),
                key: "credentials",
                required: false,
              } : {
                type: "text",
                label: i18n.__("Event"),
                key: "credentials",
                required: true,
              },
            ],
          },
          {
            type: "columns",
            name: "create_referrer_cols_2",
            widgets: [
              {
                type: "select",
                key: "orgId",
                label: i18n.__("Referrer's Organization"),
                required: true,
                options: referrerOrganizations.map((org) => ({
                  label: org.title,
                  value: String(org.value),
                })).sort((a, b) => a.label.localeCompare(b.label)),
              },
              {
                type: "text:email",
                key: "email",
                label: i18n.__("Referrer's Email"),
                required: true,
              },
            ],
          },
        ],
      },
      post_auth_referrer: {
        type: "api",
        path: "/auth/referrer",
        method: "post",
      },
      sync_or_async: {
        type: "basic",
        widgets: [
          {
            type: "header-subheader",
            name: "sync_or_async_header",
            header: i18n.__(
              "Can the patient you're referring confirm their availability for scheduling an appointment at this time?"
            ),
          },
          {
            type: "select",
            required: true,
            key: "type",
            options: [
              {
                label: i18n.__(
                  "Yes, they will share their preferred time, which I can use to schedule their appointment."
                ),
                value: "sync",
              },
              {
                label: i18n.__(
                  "No, they will schedule their preferred appointment time after the referral is created."
                ),
                value: "async",
              },
            ],
          },
        ],
      },
    },
    workflow: {
      start: { step: options.firstStep },
      maxTotalSteps: options.firstStep === "create_referrer" ? 3 : 1,
      config: {
        create_referrer: {
          step: "create_referrer",
          next: { step: "post_auth_referrer" },
          maxRemainingSteps: 2,
        },
        post_auth_referrer: {
          step: "post_auth_referrer",
          next: { step: "sync_or_async" },
          maxRemainingSteps: 1,
        },
        sync_or_async: {
          maxRemainingSteps: 0,
          step: "sync_or_async",
          footerConfig: {
            backButton: {
              // Don't allow going back, the logout button will appear and they can exit the flow that way instead
              hide: true,
            },
          },
          next: {
            action: "REDIRECT",
            toUrl: [
              {
                condition: ["stringEquals", "type", "sync"],
                then: "/schedule/auth/register?enrollment=referrer",
              },
              {
                condition: ["stringEquals", "type", "async"],
                then: "/schedule/refer/create",
              },
            ],
          },
        },
      },
    },
  };

  return flow;
}
