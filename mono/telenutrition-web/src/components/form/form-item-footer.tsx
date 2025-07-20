import { QuestionDisclaimer } from '../../api/api-types';
import FormErrorMessage from './form-error-message';

interface FormItemFooterProps {
  questionKey: string;
  disclaimer?: QuestionDisclaimer;
}

export default function FormItemFooter({ questionKey, disclaimer }: FormItemFooterProps) {
  return <FormErrorMessage questionKey={questionKey} />;
}
