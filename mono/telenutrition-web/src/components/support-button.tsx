import { useTranslation } from 'react-i18next';
import Button, { ButtonProps } from './button';

export const SUPPORT_LINK = 'https://zipongosupport.zendesk.com/hc/en-us';

export function useSupportButtonProps() {
  const { t } = useTranslation()
  return {
    onClick: () => window.open(SUPPORT_LINK, '_blank'),
    children: t('ContactSupport', 'Contact Support')
  }
}

export default function SupportButton(props: ButtonProps) {
  const supportButtonProps = useSupportButtonProps()
  return (
    <Button {...supportButtonProps} {...props} />
  );
}
