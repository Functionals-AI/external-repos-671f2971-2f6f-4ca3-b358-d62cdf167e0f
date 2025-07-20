import { IContext } from "@mono/common/src/context";
import { FlowBasicStep } from "../../../types/flow";
import { SingleCheckboxWidgetFlows } from "../../../types/widgets";
import {
  displayAppointmentDataWidget,
  displayPersonalInfoForBookingDataWidget,
} from "../../../reusable-widgets";
import { PaymentMethodTypeRecord } from "../../../../payment/store";

interface GetReviewStepOptions {
  requireConsent: boolean;
  paymentMethodTypes: PaymentMethodTypeRecord[]
}

function mapNotNull<T,S>(list: T[], mapper: (item: T) => S | undefined): S[] {
  return list.map(mapper).filter(i => i !== undefined) as S[]
}

export const getReviewStep = (
  context: IContext,
  options: GetReviewStepOptions
): FlowBasicStep => {
  const { i18n } = context;
  const audioMethods = options.paymentMethodTypes.filter(m => m.audioSupport !== 'never')
  const audioDefaultMethods = audioMethods.filter(m => m.audioSupport === 'default')
  return {
    type: "basic",
    widgets: [
      {
        type: "header-subheader",
        header: i18n.__("Review Your Visit Details"),
        subheader: i18n.__(
          "Confirm your visit details and contact information before booking."
        ),
        name: "review_header",
      },
      displayAppointmentDataWidget(i18n),
      {
        type: "text",
        label: i18n.__("Have a promo code? Enter it below:"),
        key: "promo",
      },
      {
        type: "hr",
        color: "#478043",
        height: 2,
        name: "hr-1",
      },
      displayPersonalInfoForBookingDataWidget(i18n),
      {
        type: "hr",
        color: "#478043",
        height: 2,
        name: "hr-2",
      },
      {
        type: "single-checkbox",
        key: "audio_only",
        condition: ["or", [
            ["numericIn", "insurance_id", mapNotNull(audioMethods, m => m.insuranceId)],
            ["numericIn", "employer_id", mapNotNull(audioMethods, m => m.employerId)]
          ]
        ],
        defaultChecked: ["or", [
            ["numericIn", "insurance_id", mapNotNull(audioDefaultMethods, m => m.insuranceId)],
            ["numericIn", "employer_id", mapNotNull(audioDefaultMethods, m => m.employerId)],
          ]
        ],
        overview: i18n.__("You will receive a video visit link by text, at the time of your visit. The visit will be completed over zoom. Please check here, if you would prefer to do a phone call only and your RD will call you directly at the number you listed."),
        value: "true",
        label: i18n.__(
          "Audio Only"
        ),
      },
      {
        type: "p",
        text: i18n.__(
          "See something wrong? Click below to restart from the beginning."
        ),
        name: "see_something_wrong",
      },
      {
        type: "buttons-options",
        autoNavigateNextOnClick: true,
        buttons: [{ label: i18n.__("Restart"), value: true }],
        key: "reset_flow",
      },
      ...(options.requireConsent
        ? [
            {
              type: "single-checkbox",
              key: "consent",
              required: true,
              value: "acknowledged",
              label: i18n.__(
                "By checking this box, I have read, consent, and agree to these {{termsLink}}",
                {
                  termsLink: `<a target="_blank" href="${
                    context.config.telenutrition_web.baseUrl
                  }/legal/terms?locale=${i18n.getLocale()}">${i18n.__(
                    "Terms and Conditions"
                  )}</a>`,
                }
              ),
            } as SingleCheckboxWidgetFlows,
          ]
        : []),
    ],
  };
};
