import { AnimatePresence, motion } from 'framer-motion';
import { useWizardContext } from './context';
import { WizardFormState } from './types';
import ContainerLoading from '@/ui-components/loading/container-loading';

export default function WizardSteps<
  WizardStepName extends string,
  TWizardFormState extends WizardFormState,
>() {
  const {
    currStepKey,
    currentStep,
    goTo,
    goBack,
    loadingState,
    setLoadingState,
    resetWizard,
    formState,
    setFormState,
    fireFinalAnalyticEvent,
    assertValueDefined,
    getFormStateWithRequiredFields,
  } = useWizardContext();

  return (
    <AnimatePresence exitBeforeEnter>
      <motion.div
        key={currStepKey}
        initial={{ x: 10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -10, opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {loadingState.isLoading && <ContainerLoading />}
        {currentStep.render({
          goTo,
          goBack,
          loadingState,
          setLoadingState,
          resetWizard,
          formState,
          setFormState,
          fireFinalAnalyticEvent,
          assertValueDefined,
          getFormStateWithRequiredFields,
        })}
      </motion.div>
    </AnimatePresence>
  );
}
