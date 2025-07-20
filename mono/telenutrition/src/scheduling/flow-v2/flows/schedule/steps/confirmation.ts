import { IContext } from "@mono/common/src/context";
import { FlowBasicStep } from "../../../types/flow";
import {
  displayAppointmentDataWidget,
  displayPersonalInfoForBookingDataWidget,
} from "../../../reusable-widgets";
import { ButtonOptionsWidget } from "../../../types/widgets";

interface GetConfirmationStepOptions {
  buttonsOptionsWidget: ButtonOptionsWidget | null;
}

export const getConfirmationStep = (
  context: IContext,
  options: GetConfirmationStepOptions
): FlowBasicStep => {
  const { i18n } = context;

  return {
    type: "basic",
    widgets: [
      {
        type: "header-subheader",
        header: i18n.__("Virtual Visit Confirmation"),
        subheader: i18n.__(
          "Your virtual visit has been booked! We look forward to meeting with you."
        ),
        name: "new_patient_confirmation_header",
      },
      displayAppointmentDataWidget(i18n),
      {
        type: "hr",
        color: "#478043",
        height: 2,
        name: "hr-1",
      },
      displayPersonalInfoForBookingDataWidget(i18n),
      ...(options.buttonsOptionsWidget !== null
        ? [options.buttonsOptionsWidget]
        : []),
    ],
  };
};
