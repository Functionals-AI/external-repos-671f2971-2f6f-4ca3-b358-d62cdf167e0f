import { useEffect } from 'react';
import { RegisterOptions, useFormContext } from 'react-hook-form';

export default function useRegisterField(questionKey: string, registerOptions: RegisterOptions) {
  const { register, unregister } = useFormContext();
  useEffect(() => {
    return () => unregister(questionKey);
  }, []);
  return register(questionKey, registerOptions);
}
