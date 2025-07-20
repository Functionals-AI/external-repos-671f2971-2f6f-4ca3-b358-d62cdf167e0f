import { FieldValues, SubmitHandler, UseFormReturn } from 'react-hook-form';
import CustomFormProvider from './form/custom-form-provider';
import classNames from '../utils/classNames';

type FFormProps<Values extends FieldValues> = {
  form: UseFormReturn<Values>;
  onSubmit: SubmitHandler<Values>;
  children: React.ReactNode;
  layoutWidth?: 'medium' | 'large';
};

export default function FForm<Values extends FieldValues>({
  form,
  onSubmit,
  children,
  layoutWidth = 'medium',
}: FFormProps<Values>) {
  return (
    <CustomFormProvider form={form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={classNames(
          'space-y-6 m-auto px-8 pt-8 flex flex-col',
          layoutWidth === 'large' ? 'max-w-5xl' : 'max-w-3xl',
        )}
      >
        {children}
      </form>
    </CustomFormProvider>
  );
}
