import { IContext } from "@mono/common/lib/context";
import { Flow } from "../../types/flow";
import { ScheduleFlowStepName, getSteps } from "./steps/all-steps";
import { getReviewStep } from "./steps/review";
import { getConfirmationStep } from "./steps/confirmation";
import { ErrCode } from "@mono/common/lib/error";
import { err, ok, Result } from "neverthrow";
import { selectPaymentMethodTypes } from "../../../payment/store";

interface GetScheduleFlowOptions {
  requireConsent: boolean;
  isReferral?: boolean;
  accountId?: number;
  scheduleByTimeExperiment: boolean;
}

export const getUserScheduleFlow: (
  context: IContext,
  options: GetScheduleFlowOptions
) => Promise<
  Result<Flow<Exclude<ScheduleFlowStepName, "additional-info">>, ErrCode>
> = async (context, options) => {
  const { i18n } = context;

  const paymentMethodTypesResult = await selectPaymentMethodTypes(context, { showHidden: true });
  if (paymentMethodTypesResult.isErr()) {
    return err(ErrCode.SERVICE);
  }
  const steps = getSteps(context, {
    isReferral: options.isReferral,
    accountId: options.accountId,
    paymentMethodTypes: paymentMethodTypesResult.value
  });
  return ok({
    steps: {
      ...steps,
      review: getReviewStep(context, {
        requireConsent: options.requireConsent,
        paymentMethodTypes: paymentMethodTypesResult.value
      }),
      confirmation: getConfirmationStep(context, {
        buttonsOptionsWidget: {
          type: "buttons-options",
          autoNavigateNextOnClick: true,
          buttons: [
            {
              label: i18n.__("Schedule Another"),
              value: "schedule_another",
            },
            {
              label: i18n.__("Go to dashboard"),
              value: "go_to_dashboard",
            },
          ],
          key: "confirmation_nav_next",
        },
      }),
    },
    workflow: {
      start: options.isReferral ? { step: "icd10-codes" } : { step: "payment" },
      maxTotalSteps: 8,
      config: {
        "icd10-codes": {
          step: "icd10-codes",
          maxRemainingSteps: 7,
          next: { step: "payment" },
        },
        payment: {
          step: "payment",
          maxRemainingSteps: 5,
          next: options.scheduleByTimeExperiment ? { step: "schedule_by_selection" } : { step: "calendar" },
        },
        schedule_by_selection: {
          step: "schedule_by_selection",
          maxRemainingSteps: 4,
          next: [
            {
              condition: ["stringEquals", "scheduleByType", "time"],
              then: { step: 'by_time_calendar' }
            },
            { then: { step: 'calendar'}}
          ]
        },
        // TODO: temp until update api enabled in Athena
        // next: [
        //   {
        //     condition: ["stringEquals", "method", "plan"],
        //     then: { step: "address" },
        //   },
        //   { then: { step: "calendar" } },
        // ],
        //},
        // address: {
        //   step: "address",
        //   maxRemainingSteps: 4,
        //   next: { step: "calendar" },
        // },
        by_time_calendar: {
          step: "by_time_calendar",
          maxRemainingSteps: 3,
          next: { step: 'review' }
        },
        calendar: {
          step: "calendar",
          maxRemainingSteps: 3,
          next: { step: "review" },
        },
        review: {
          step: "review",
          maxRemainingSteps: 2,
          next: [
            {
              condition: ["booleanEquals", "reset_flow", true],
              then: { action: "RESET_AND_RESTART" },
            },
            {
              then: { step: "book-appointment" },
            },
          ],
          footerConfig: {
            nextButton: {
              text: i18n.__("Schedule Visit"),
            },
          },
        },
        "book-appointment": {
          step: "book-appointment",
          maxRemainingSteps: 1,
          next: { step: "confirmation" },
        },
        confirmation: {
          step: "confirmation",
          maxRemainingSteps: 0,
          footerConfig: {
            hide: true,
          },
          next: [
            {
              condition: [
                "stringEquals",
                "confirmation_nav_next",
                "schedule_another",
              ],
              then: { action: "CREATE_NEW_FLOW" },
            },
            {
              condition: [
                "stringEquals",
                "confirmation_nav_next",
                "go_to_dashboard",
              ],
              then: { action: "REDIRECT", toUrl: "/schedule/dashboard" },
            },
          ],
        },
      },
    },
  });
};
