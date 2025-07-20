import Icon from '@/ui-components/icons/Icon';
import { cn } from '@/utils';
import React from 'react';

function StepIndicator({ status }: { status: StepStatus }): JSX.Element {
  const baseClassName =
    'transition flex flex-row items-center justify-center w-6 h-6 rounded-full border-2';

  if (status === 'completed') {
    return (
      <div
        className={cn(
          baseClassName,
          'bg-fs-green-300 border-fs-green-300 flex items-center justify-center',
        )}
      >
        <Icon name="check" color="white" size="xs" />
      </div>
    );
  }

  if (status === 'active') {
    return (
      <div className={cn(baseClassName, 'border-fs-green-300')}>
        <div className={`w-2.5 h-2.5 rounded-full bg-fs-green-300`} />
      </div>
    );
  }

  return <div className={cn(baseClassName)}></div>;
}

export interface StepBarProps {
  className?: string;
  curStep: number;
  steps: string[];
  showStepText?: boolean;
  onClick?: (step: number) => void;
}

type StepStatus = 'completed' | 'active' | 'incomplete';

export default function StepBar({
  className,
  steps,
  showStepText = true,
  curStep,
  onClick,
}: StepBarProps) {
  const getStepStatus = (stepInd: number): StepStatus =>
    stepInd < curStep ? 'completed' : stepInd === curStep ? 'active' : 'incomplete';

  return (
    <div className={cn('flex flex-row p-4', className)}>
      {steps.map((step, stepInd) => {
        const stepStatus = getStepStatus(stepInd);
        return (
          <React.Fragment key={step}>
            <div className="relatve flex flex-col items-center" onClick={() => onClick?.(stepInd)}>
              <StepIndicator status={stepStatus} />
              {showStepText && (
                <div className="absolute whitespace-nowrap mt-[26px]">
                  <p
                    className={cn(
                      'text-xs',
                      stepStatus === 'active' && 'text-neutral-1500',
                      stepStatus === 'incomplete' && 'text-neutral-400',
                    )}
                  >
                    {step}
                  </p>
                </div>
              )}
            </div>
            {stepInd < steps.length - 1 && (
              <div className="flex-1 h-6 flex flex-col justify-center">
                <div
                  className={`transition h-0.5 w-full border ${
                    stepInd < curStep ? 'border-fs-green-300' : 'border-neutral-500'
                  }`}
                ></div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
