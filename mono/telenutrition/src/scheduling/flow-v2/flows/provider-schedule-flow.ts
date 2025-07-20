import { IContext } from "@mono/common/src/context";
import { Flow } from "../types/flow";
import { DataPointDisplay } from "../types/widgets";
import * as zs from "zapatos/schema";
import { mapStateToLabel } from "../helpers";
import { AppointmentRecord } from "../../appointment/types";
import { PatientRecord } from "../../patient/store";
import { PaymentMethodRecord } from "../../payment/store";
import { ProviderRecord } from "../../provider/shared";

type GetProviderScheduleFlowOptions = {
  patient: PatientRecord;
  provider: ProviderRecord;
  appointments: AppointmentRecord[];
  appointmentTypes: zs.telenutrition.schedule_appointment_type.JSONSelectable[];
  patientPaymentMethod: PaymentMethodRecord;
};

type ProviderScheduleFlowStep =
  | "select_patient_and_appointment_type"
  | "book_provider_appointment"
  | "confirmation";

export function getProviderScheduleFlow(
  context: IContext,
  options: GetProviderScheduleFlowOptions
): Flow<ProviderScheduleFlowStep> {
  const { i18n } = context;

  const firstAppointment = options.appointments[0];
  const duration: 30 | 60 = options.appointments.length === 1 ? 30 : 60;
  const filteredAppointmentTypes = options.appointmentTypes.filter(
    (appt) => appt.duration === duration
  );

  const flow: Flow<ProviderScheduleFlowStep> = {
    steps: {
      select_patient_and_appointment_type: {
        type: "basic",
        widgets: [
          {
            type: "header-subheader",
            name: "header-1",
            header: i18n.__("Appointment"),
            headerSize: "xl",
          },
          {
            type: "data-display",
            name: "dd-1",
            blocks: [
              {
                dataPoints: [
                  {
                    type: "html",
                    html: `<span style="font-weight: 600;">${i18n.__(
                      "Start Time"
                    )}:</span> ${firstAppointment.startTime}`,
                    name: "start_time",
                  },
                  {
                    type: "html",
                    html: `<span style="font-weight: 600;">${i18n.__(
                      "Date"
                    )}:</span> ${firstAppointment.startDate}`,
                    name: "date",
                  },
                  {
                    type: "html",
                    html: `<span style="font-weight: 600;">Duration:</span> ${duration} minutes`,
                    name: "duration",
                  },
                ],
                name: "dp-100",
                cols: 2,
              },
            ],
          },
          {
            type: "hr",
            height: 2,
            name: "hr-1",
            color: "#478043",
          },
          {
            type: "header-subheader",
            name: "header-for-provider",
            header: i18n.__("Provider Information"),
            headerSize: "xl",
          },
          {
            type: "data-display",
            name: "dd-provider",
            blocks: [
              {
                name: "dd-key-1",
                cols: 2,
                dataPoints: [
                  {
                    type: "html",
                    html: `<span style="font-weight: 600;">${i18n.__(
                      "Name"
                    )}:</span> ${options.provider.name}`,
                    name: "provider_name",
                  },
                ],
              },
            ],
          },
          {
            type: "hr",
            height: 2,
            name: "hr-2",
            color: "#478043",
          },
          {
            type: "header-subheader",
            name: "header-2",
            header: i18n.__("Patient Information"),
            headerSize: "xl",
          },
          {
            type: "data-display",
            name: "dd-2",
            blocks: [
              {
                dataPoints: [
                  {
                    type: "html",
                    html: `<span style="font-weight: 600;">${i18n.__(
                      "Name"
                    )}:</span> ${options.patient.firstName} ${
                      options.patient.lastName
                    }`,
                    name: "patient_name",
                  },
                  {
                    type: "html",
                    html: `<span style="font-weight: 600;">${i18n.__(
                      "Gender"
                    )}:</span> ${
                      options.patient.sex?.toUpperCase() === "M"
                        ? i18n.__("Male")
                        : i18n.__("Female")
                    }`,
                    name: "patient_gender",
                  },
                  {
                    type: "html",
                    html: `<span style="font-weight: 600;">${i18n.__(
                      "State"
                    )}:</span> ${mapStateToLabel(options.patient.state)}`,
                    name: "patient_state",
                  },
                  ...(options.patient.timezone
                    ? [
                        {
                          type: "html",
                          html: `<span style="font-weight: 600;">${i18n.__(
                            "Timezone"
                          )}:</span> ${options.patient.timezone}`,
                          name: "date",
                        } as DataPointDisplay,
                      ]
                    : []),
                  {
                    type: "html",
                    html: `<span style="font-weight: 600;">${i18n.__(
                      "Patient Payment Plan"
                    )}:</span> ${options.patientPaymentMethod.label}`,
                    name: "patient_payment_plan",
                  },
                ],
                name: "dd-123",
                cols: 2,
              },
            ],
          },
          {
            type: "hr",
            height: 2,
            name: "hr-3",
            color: "#478043",
          },
          {
            type: "header-subheader",
            name: "header-3",
            header: i18n.__("Additional Information"),
            headerSize: "xl",
          },
          {
            type: "select",
            key: "appointment_type_id",
            required: true,
            label: i18n.__("What type of appointment are you scheduling?"),
            options: filteredAppointmentTypes.map((apptType) => ({
              value: apptType.appointment_type_id,
              label: apptType.name,
            })),
          },
          {
            type: "buttons-options",
            autoNavigateNextOnClick: true,
            key: "back_to_dashboard",
            buttons: [
              {
                label: i18n.__("Go Back"),
                value: "true",
              },
            ],
          },
        ],
      },
      book_provider_appointment: {
        type: "api",
        path: "/provider/appointments",
        method: "post",
      },
      confirmation: {
        type: "basic",
        widgets: [
          {
            type: "header-subheader",
            name: "confirmation-header",
            header: i18n.__("Successfully Booked Appointment"),
            subheader: i18n.__(
              "The patient will be notified about their new appointment"
            ),
          },
        ],
      },
    },
    workflow: {
      start: { step: "select_patient_and_appointment_type" },
      maxTotalSteps: 3,
      config: {
        select_patient_and_appointment_type: {
          step: "select_patient_and_appointment_type",
          next: [
            {
              condition: ["stringEquals", "back_to_dashboard", "true"],
              then: { action: "REDIRECT", toUrl: "/schedule/providers" },
            },
            { then: { step: "book_provider_appointment" } },
          ],
          maxRemainingSteps: 2,
          footerConfig: {
            nextButton: {
              text: i18n.__("Book Appointment for Patient"),
            },
          },
        },
        book_provider_appointment: {
          step: "book_provider_appointment",
          maxRemainingSteps: 1,
          next: { step: "confirmation" },
        },
        confirmation: {
          step: "confirmation",
          maxRemainingSteps: 0,
          next: {
            action: "REDIRECT",
            toUrl: "/schedule/providers",
          },
          footerConfig: {
            backButton: {
              hide: true,
            },
            nextButton: {
              text: i18n.__("Go To Dashboard"),
            },
          },
        },
      },
    },
  };

  return flow;
}
