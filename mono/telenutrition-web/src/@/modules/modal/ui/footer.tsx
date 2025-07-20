import ButtonBar, { ButtonBarProps } from '@/ui-components/button/group';
import { Button, ButtonProps } from '@/ui-components/button';
import { useModal } from '..';
import { useWizardContext } from 'components/wizard/context';
const ButtonGroup = ButtonBar.Group;

const Footer = (props: ButtonBarProps) => <ButtonBar borderTop {...props} />;

/**
 * Used for wizard in modal
 */
const BackButton = (props: ButtonProps) => {
  const wizard = useWizardContext();

  return (
    <Button
      leftIcon={{ name: 'arrow-left' }}
      type="button"
      onClick={wizard.goBack}
      variant="tertiary"
      {...props}
    >
      Back
    </Button>
  );
};

/**
 * Secondary button used specifically for closing modals
 */
const SecondaryCloseButton = ({
  ...props
}: Omit<ButtonProps, 'children'> & Required<Pick<ButtonProps, 'children'>>) => {
  const modal = useModal();
  return <Button onClick={() => modal.closeAll()} variant="secondary" {...props} />;
};

const PrimaryButton = (
  props: Omit<ButtonProps, 'children'> & Required<Pick<ButtonProps, 'children'>>,
) => <Button type="submit" variant="primary" {...props} />;

Footer.ButtonGroup = ButtonGroup;
Footer.BackButton = BackButton;
Footer.SecondaryCloseButton = SecondaryCloseButton;
Footer.PrimaryButton = PrimaryButton;

export default Footer;
