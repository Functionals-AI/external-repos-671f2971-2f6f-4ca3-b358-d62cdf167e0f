import type { FlowBasicStep as IFlowBasicStep } from '@mono/telenutrition/lib/types';
import FlowWidget from '../widgets/flow-widget';
import { useWorkflowEngineContext } from '../workflow-engine/context';
import { calculateConditional } from '../workflow-engine/helpers';
import { StepData } from '../workflow-engine/types';
import FlowStepFooter from './flow-step-footer';

interface FlowBasicStepProps {
  stepData: StepData;
}

export default function FlowBasicStep({ stepData }: FlowBasicStepProps) {
  const { isFirstStep, handleBack, form, getFlowStateValue, getFlowStateDisplayValue } =
    useWorkflowEngineContext();

  return (
    <div className="max-w-5xl m-auto px-6 flex flex-col gap-y-4">
      {(stepData.step as IFlowBasicStep).widgets
        .map((widget) => {
          if (widget.condition) {
            const calculated = calculateConditional(widget.condition, true, getFlowStateValue);
            if (!calculated) {
              return null;
            }
          }

          return (
            <FlowWidget
              key={'key' in widget ? widget.key : widget.name}
              widget={widget}
              getFlowStateValue={getFlowStateValue}
              getFlowStateDisplayValue={getFlowStateDisplayValue}
            />
          );
        })
        .filter((widget) => !!widget)}
      <FlowStepFooter
        {...{
          showBackButton: !isFirstStep,
          handleBack,
          form,
          footerConfig: stepData.stepConfig.footerConfig,
        }}
      />
    </div>
  );
}
