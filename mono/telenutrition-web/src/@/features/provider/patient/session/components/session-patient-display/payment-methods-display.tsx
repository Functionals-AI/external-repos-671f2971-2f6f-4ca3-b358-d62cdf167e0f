import Card from '@/ui-components/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/ui-components/collapsible';
import Icon from '@/ui-components/icons/Icon';
import { cn } from '@/utils';
import { DateTime } from 'luxon';
import { UseGetAppointmentByIdReturn } from 'api/useGetAppointmentById';

export default function PaymentMethodsDisplay({
  appointmentDetails,
}: {
  appointmentDetails: UseGetAppointmentByIdReturn;
}) {
  const allPaymentMethods = [
    ...(appointmentDetails.paymentMethod
      ? [{ ...appointmentDetails.paymentMethod, isSelected: true }]
      : []),
    ...appointmentDetails.patientPaymentMethods
      .map((method) => ({ ...method, isSelected: false }))
      .filter((method) => method.id !== appointmentDetails.paymentMethod?.id),
  ].filter((p) => !!p);

  if (allPaymentMethods.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-y-2">
      {allPaymentMethods.map((paymentMethod) => {
        return (
          <Collapsible key={paymentMethod.id}>
            <CollapsibleTrigger className="flex gap-x-1 group">
              <Icon
                name="chevron-right"
                size="sm"
                className={cn("group-data-[state='open']:rotate-90 transition-transform")}
              />
              <p className="flex-1">{paymentMethod.label}</p>
              {paymentMethod.isSelected && (
                <span className="ml-2 flex gap-x-1 items-center">
                  <p className="text-sm text-status-green-400">Selected</p>
                  <Icon size="sm" name="check" color="statusGreen" />
                </span>
              )}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="p-4">
                {paymentMethod.lastUsed && (
                  <p>
                    Last used: {DateTime.fromISO(paymentMethod.lastUsed).toFormat('LLL dd, yyyy')}
                  </p>
                )}
                <p>Status: {paymentMethod.status}</p>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
