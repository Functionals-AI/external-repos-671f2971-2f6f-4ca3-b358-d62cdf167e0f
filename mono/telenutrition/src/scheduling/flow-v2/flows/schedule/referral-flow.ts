import { IContext } from "@mono/common/lib/context";
import { Flow } from "../../types/flow";
import { getSteps, ScheduleFlowStepName } from "./steps/all-steps";
import { getAdditionalInfoStep } from "./steps/additional-info";
import { ErrCode } from "@mono/common/lib/error";
import { err, ok, Result } from "neverthrow";
import { selectPaymentMethodTypes } from "../../../payment/store";

/**
 * Assumes referral_type is given in initial state
 * (Async) invites / refers user to join foodsmart
 */
export const getReferralFlow: (
  context: IContext
) => Promise<Result<Flow<Exclude<ScheduleFlowStepName, "review" | "confirmation">>, ErrCode>> = async (
  context
) => {
  const { i18n } = context;

  const paymentMethodTypesResult = await selectPaymentMethodTypes(context)
  if (paymentMethodTypesResult.isErr()) {
    return err(ErrCode.SERVICE);
  }
  const steps = getSteps(context, {
    isReferral: true,
    paymentMethodTypes: paymentMethodTypesResult.value
  });
  return ok({
    steps: {
      ...steps,
      "additional-info": getAdditionalInfoStep(context, {
        widgetConfigs: [
          { key: "email", required: true },
          { key: "phone", required: false },
          { key: "state-and-timezone", required: true },
        ],
      }),
    },
    workflow: {
      start: { step: "identity" },
      maxTotalSteps: 8,
      config: {
        identity: {
          step: "identity",
          maxRemainingSteps: 7,
          next: { step: "additional-info" },
        },
        "additional-info": {
          step: "additional-info",
          maxRemainingSteps: 6,
          next: [
            {
              condition: ["stringEquals", "referral_type", "referrer"],
              then: { step: "referral-payment" },
            },
            { then: { step: "payment" } },
          ],
        },
        "referral-payment": {
          maxRemainingSteps: 5,
          step: "referral-payment",
          next: { step: "address" },
        },
        payment: {
          maxRemainingSteps: 5,
          step: "payment",
          next: { step: "address" },
        },
        address: {
          maxRemainingSteps: 4,
          step: "address",
          next: [
            {
              condition: ["stringEquals", "referral_type", "referrer"],
              then: { step: "icd10-codes" },
            },
            { then: { step: "referral-review" } },
          ],
        },
        "icd10-codes": {
          maxRemainingSteps: 3,
          step: "icd10-codes",
          next: { step: "referral-review" },
        },
        "referral-review": {
          maxRemainingSteps: 2,
          step: "referral-review",
          next: { step: "create-referral" },
          footerConfig: {
            nextButton: {
              text: i18n.__("Create Referral"),
            },
          },
        },
        "create-referral": {
          maxRemainingSteps: 1,
          step: "create-referral",
          next: { step: "referral-confirmation" },
        },
        "referral-confirmation": {
          step: "referral-confirmation",
          maxRemainingSteps: 0,
          next: [
            {
              condition: [
                "stringEquals",
                "next_button_action",
                "refer_another",
              ],
              then: {
                action: "RESET_AND_RESTART",
              },
            },
            {
              // This is default case just in case
              // condition: ["stringEquals", "next_button_action", "done"],
              then: {
                action: "LOGOUT_AND_REDIRECT",
                toUrl: "/schedule/auth/login",
              },
            },
          ],
          footerConfig: {
            hide: true,
          },
        },
      },
    },
  });
};
