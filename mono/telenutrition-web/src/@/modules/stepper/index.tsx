import StepBar, { StepBarProps } from './step-bar';
import _ from 'lodash';
import { ReactNode, createContext, useContext, useState } from 'react';
import { DeveloperError } from 'utils/errors';
import { Button, ButtonProps } from '@/ui-components/button';
import ButtonBar from '@/ui-components/button/group';
import { AnimatePresence, motion } from 'framer-motion';
import { IStepperContext, StepperProps } from './types';

export function useStepper({ start = 0, steps }: StepperProps): IStepperContext {
  const [currStep, setCurrStep] = useState(start);

  function next() {
    setCurrStep((s) => s + 1);
  }

  function back() {
    setCurrStep((s) => s - 1);
  }

  function goTo(step: number) {
    if (step < 0 || step >= currStep) {
      throw new DeveloperError('Go Back button should be hidden if canGoBack is false');
    }

    setCurrStep(step);
  }

  const isFirstStep = currStep === 0;
  const isLastStep = currStep === steps.length - 1;

  return { isFirstStep, steps, currStep, isLastStep, next, back, goTo };
}

export function useStepperContext() {
  const context = useContext(StepperContext);

  if (context === null) throw new DeveloperError('Cannot use useStepper outside of Stepper');

  return context;
}

const StepperContext = createContext<IStepperContext | null>(null);

function Stepper({ children, ...state }: IStepperContext & { children: ReactNode }) {
  return <StepperContext.Provider value={state}>{children}</StepperContext.Provider>;
}

function _StepBar(props: Partial<StepBarProps>) {
  const context = useStepperContext();
  return (
    <StepBar
      {...props}
      curStep={props?.curStep ?? context.currStep}
      steps={props?.steps ?? context.steps.map((s, index) => s.name || `${index + 1}`)}
      onClick={props?.onClick ?? context.goTo}
    />
  );
}

function Step() {
  const context = useStepperContext();

  const step = context.steps[context.currStep];
  return (
    <AnimatePresence exitBeforeEnter>
      <motion.div
        key={context.currStep}
        initial={{ x: 10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -10, opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {step.render(context)}
      </motion.div>
    </AnimatePresence>
  );
}

export function BasicFooter({ secondaryButton }: { secondaryButton?: ButtonProps }) {
  const { isFirstStep, back, isLastStep } = useStepperContext();
  return (
    <ButtonBar borderTop className="w-full h-16 p-0 items-center justify-between">
      <ButtonBar.Group>
        {!isFirstStep && (
          <Button variant="tertiary" onClick={back}>
            Back
          </Button>
        )}
      </ButtonBar.Group>
      <ButtonBar.Group>
        {secondaryButton && <Button variant="secondary" {...secondaryButton} />}
        <Button type="submit" variant="primary">
          {isLastStep ? 'Finish' : 'Next'}
        </Button>
      </ButtonBar.Group>
    </ButtonBar>
  );
}

function Header() {
  const { currStep, steps } = useStepperContext();
  const { name } = steps[currStep];

  return <>{name}</>;
}

Stepper.Header = Header;
Stepper.StepBar = _StepBar;
Stepper.Step = Step;
// There is no requirement to use this component. It just has prebuilt logic and ui
// that will be used for most cases.
Stepper.BasicFooter = BasicFooter;

export default Stepper;
