import _ from 'lodash';
import HeaderSubheader from '../../../../components/header-subheader';
import { ApiRequestError, DeveloperError } from '../../../../utils/errors';
import { useWorkflowEngineContext } from '../../flow-engine/workflow-engine/context';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useGetPatientPaymentMethods from '../../../../api/useGetPatientPaymentMethods';
import Select from '../../../../components/form/select';
import { useFormContext } from 'react-hook-form';
import usePostPatientPaymentMethods from '../../../../api/usePostPatientPaymentMethods';
import Wizard from '../../../../components/wizard';
import FlowTransition from '../../../../components/layouts/basic/transition';
import WizardSteps from '../../../../components/wizard/wizard-steps';
import Button from '../../../../components/button';
import FlowWidget from '../../flow-engine/widgets/flow-widget';
import type { FlowBasicStep as IFlowBasicStep, WorkflowWidget } from '@mono/telenutrition/lib/types';
import FlowStepFooter from '../../flow-engine/flow-step/flow-step-footer';
import Loading from '../../../../components/loading';
import ApiGetError from '../../../../components/api-get-error';
import { useModalManager } from '../../../modal/manager';
import DateInput from '../../../../components/form/text-input/date-input';
import { useAppStateContext } from 'state/context';
import usePostPaymentMethodEligibility from 'api/usePostPaymentMethodEligibility';

type PaymentEligibilityChallenge = {
  birthday?: string
}

export default function PaymentStep() {
  const { t } = useTranslation();
  const { dispatch } = useAppStateContext();
  const {
    form,
    currentStepData,
    isFirstStep,
    handleBack,
    handleNext,
    getFlowStateValue,
    getFlowStateDisplayValue
  } = useWorkflowEngineContext();

  const patientId = getFlowStateValue('patient_id') as number | null;

  if (patientId === undefined || patientId === null) {
    throw new DeveloperError('Patient Id is required');
  }
  const { data, isLoading, error, refetch } = useGetPatientPaymentMethods({ patientId });
  const { post: postPaymentMethod } = usePostPatientPaymentMethods({ patientId });
  const { post: postPaymentEligibilityCheck } = usePostPaymentMethodEligibility();
  const { setValue, getValues } = useFormContext();
  const modalManager = useModalManager();

  // Load default state from inital flow state (since this key is not part of the widget config)
  useEffect(() => {
    const paymentMethodId = getFlowStateValue('payment_method_id');
    if (paymentMethodId) {
      setValue("payment_method_id", paymentMethodId);
    }
  }, []);

  if (isLoading) {
    return <Loading/>
  } else if (error) {
    return <ApiGetError error={error} refetch={refetch}/>
  }

  const methods = data?.paymentMethods || [];
  const options = methods.map(method => ({
    id: method.id.toString(),
    title: method.label
      + (method.coverage?.remaining !== undefined ? ` [${method.coverage.remaining} remaining]` : '')
      + (!method.isValid ? ` (${method.status})` : '')
  }));
  const payments: Record<number, any> = methods.reduce((res, method) => ({
    ...res,
    [method.id]: method.payment
  }), {});
  const hasPaymentMethod = options.length > 0;
  const hasSelfPayMethod = methods.some(method => method.payment.method == 'self-pay');
  const hasEligiblePaymentMethod = methods.some(method => method.eligibleId !== undefined && method.isValid);

  const showInvalidPayment = () => modalManager.openModal({
    type: 'Error',
    title: 'Invalid payment info',
    subtitle: `Sorry, the information you entered does not match any valid data in our records, please verify your input or try a different payment method`,
  });
  const handleAddPaymentMethod = (payload: { payment: Record<string, any>, birthday?: Date }, onChallenge: (challenge: PaymentEligibilityChallenge) => void) => {
    return postPaymentMethod({ payload }).then(({data}) => {
      dispatch({ type: 'APP_USER_INVALIDATED' })
      return handleNextWithEligibilityCheck({
        paymentMethodId: data.paymentMethodId,
        payment: payload.payment
      })
    }).catch(e => {
      let message;
      if (e instanceof ApiRequestError) {
        if (e.code === 'already-exists') {
          message = t('ErrorPaymentAlreadyExists', 'Payment method already exists')
        } else if (e.code === 'not-found') {
          return showInvalidPayment();
        } else if (e.code === 'verification') {
          const challenge = e.extra as PaymentEligibilityChallenge
          return onChallenge(challenge);
        }
      }
      modalManager.handleApiError({
        error: e,
        subtitle: message ?? t('ErrorAddingPaymentMethod', 'Error adding payment method'),
      })
    })
  };

  const handleNextWithEligibilityCheck = async (params: { paymentMethodId: number, payment: Record<string, any>}) => {
    try {
      const { data } = await postPaymentEligibilityCheck({
        payload: { paymentMethodId: params.paymentMethodId }
      })
      if (data.isValid) {
        return handleNext({
          ...params.payment,
          payment_method_id: params.paymentMethodId
        })
      } else {
        modalManager.openModal({
          type: 'Error',
          title: 'Invalid payment info',
          subtitle: t('PaymentMethodInvalid', 'Sorry, the payment method you selected is no longer valid, please update your payment method and try again'),
        })
      }
    } catch(e: any) {
      modalManager.handleApiError({
        error: e,
        subtitle: t('ErrorCheckingPaymentEligibility', 'Error checking payment eligibility'),
      })
    }
  }

  return <Wizard
    flowName="payment_method"
    initialState={{} as Record<string, any>}
    steps={{
      select_payment_method: {
        render: ({ goTo }) => {
          return (
            <div className="max-w-5xl m-auto px-6 space-y-6">
              <HeaderSubheader
                header={t('CoverageAndPaymentDetails', 'Coverage and Payment Details')}
                subheader={t('NewOrExistingPaymentMehod', 'Choose an existing payment method or add a new one')} />
              <Select
                label="Payment Method"
                name='Payment Method'
                questionKey='payment_method_id'
                options={options}
                registerOptions={{ required: true }} />
                <div className='space-x-2'>
                { !hasEligiblePaymentMethod && (
                  <Button
                    onClick={() => goTo('add_payment_method')} >
                    {t('Add New', 'Add New')}
                  </Button>
                )}
                {/* { !hasSelfPayMethod && (
                  <Button
                    theme='transparent'
                    onClick={() => goTo('self_pay')} >
                    {t('Self Pay', 'Self Pay')}
                  </Button>
                )} */}
              </div>
              <FlowStepFooter
                form={form}
                showBackButton={!isFirstStep}
                handleBack={handleBack}
                handleSubmit={async () => {
                  const { payment_method_id } = getValues();
                  // The appointment review page expects the payment fields to be present in the flow state....
                  const payment = payments[payment_method_id];
                  return handleNextWithEligibilityCheck({
                    paymentMethodId: payment_method_id,
                    payment
                  })
                }}
                />
            </div>
          );
        },
      },
      update_birthday: {
        render: ({ goTo, formState }) => (
          <div className="max-w-5xl m-auto px-6 flex flex-col gap-y-4">
            <HeaderSubheader
              header={t('UpdatePatientInformation', 'Update Patient Information')}
              subheader={t('InvalidPaymentEligibility', 'Please verify the following')} />
            <DateInput
              questionKey="birthday"
              name="Birthday"
              registerOptions={{ required: true }}
            />
            <FlowStepFooter
                form={form}
                showBackButton={true}
                footerConfig={{
                  nextButton: {
                    text: "Update"
                  }
                }}
                handleBack={() => goTo('add_payment_method')}
                handleSubmit={() => {
                  const payment = formState
                  const { birthday } = form.getValues()
                  handleAddPaymentMethod({ payment, birthday }, () => showInvalidPayment())
                }}
              />
          </div>
        )
      },
      self_pay: {
        render: ({ goTo, formState }) => {
          const workflow = (currentStepData.step as IFlowBasicStep).widgets
            .find(widget => 'name' in widget && widget.name == 'payment_workflow') as WorkflowWidget

          const disclaimer = workflow.steps['self_pay_disclaimer_widget']
          return (
            <div className="max-w-5xl m-auto px-6 flex flex-col gap-y-4">
              <FlowWidget
                widget={disclaimer}
                getFlowStateValue={(key) => formState[key as string] ?? getFlowStateValue(key)}
                getFlowStateDisplayValue={(key) => formState[key as string] ?? getFlowStateDisplayValue(key)}
                />
                <FlowStepFooter
                showBackButton={hasPaymentMethod || !isFirstStep}
                handleBack={() => goTo('select_payment_method')}
                form={form}
                handleSubmit={() => {
                  handleAddPaymentMethod({
                    payment: {
                      method: 'self-pay'
                    },
                  }, showInvalidPayment)
                }}/>
            </div>
          );
        }
      },
      add_payment_method: {
        render: ({ goTo, formState }) => {
          return (
            <div className="max-w-5xl m-auto px-6 flex flex-col gap-y-4">
              {(currentStepData.step as IFlowBasicStep).widgets
                .map((widget) => (
                  <FlowWidget
                    key={'key' in widget ? widget.key : widget.name}
                    widget={widget}
                    getFlowStateValue={(key) => formState[key as string] ?? getFlowStateValue(key)}
                    getFlowStateDisplayValue={(key) => formState[key as string] ?? getFlowStateDisplayValue(key)} />
                ))}
              <FlowStepFooter
                showBackButton={hasPaymentMethod || !isFirstStep}
                handleBack={() => hasPaymentMethod ? goTo('select_payment_method') : handleBack()}
                form={form}
                handleSubmit={() => {
                  const payment = _.omitBy(getValues(), _.isNil);
                  handleAddPaymentMethod({ payment }, (challenge) => {
                    modalManager.openModal({
                      type: 'Custom',
                      title: 'Invalid payment info',
                      content: `Please double check your input and ensure that your birthday is correct:\n ${challenge.birthday}`,
                      buttons: [{
                        children: 'Update Birthday',
                        onClick: () => {
                          goTo('update_birthday', {
                            updateState: (s) => ({ ...s, ...payment })
                          });
                          modalManager.closeModal();
                        },
                      }, {
                        children: 'Close',
                        onClick: () => modalManager.closeModal()
                      }],
                    });
                  });
                } } />
            </div>
          );
        }
      }
    }}
    start={hasPaymentMethod ? "select_payment_method": "add_payment_method"}
  >
    <FlowTransition>
      <WizardSteps />
    </FlowTransition>
  </Wizard>
}