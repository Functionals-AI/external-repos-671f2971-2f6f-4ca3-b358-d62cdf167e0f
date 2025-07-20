import { createContext, useContext } from 'react';
import { FormProvider as ReactHookFormProvider, UseFormReturn } from 'react-hook-form';
import { QuestionConfig } from '../../api/api-types';

interface CustomFormProviderProps {
  form: UseFormReturn<any>;
  customValidateFn?: (question: QuestionConfig, questionKey: string, field: any) => boolean;
  children: React.ReactNode;
}

const CustomFormProviderContext = createContext<null | {
  customValidateFn?: (question: QuestionConfig, questionKey: string, field: any) => boolean;
  form: UseFormReturn<any>;
}>(null);

export const useCustomFormProviderContext = () => {
  const context = useContext(CustomFormProviderContext);
  if (!context) throw new Error('Your form must be wrapped in <CustomFormProvider>');

  return context;
};

export default function CustomFormProvider({
  form,
  customValidateFn,
  children,
}: CustomFormProviderProps) {
  return (
    <ReactHookFormProvider {...form}>
      <CustomFormProviderContext.Provider value={{ customValidateFn, form }}>
        {children}
      </CustomFormProviderContext.Provider>
    </ReactHookFormProvider>
  );
}
