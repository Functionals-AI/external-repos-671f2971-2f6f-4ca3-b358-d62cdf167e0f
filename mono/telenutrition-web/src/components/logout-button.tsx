import Button, { ButtonProps } from './button';
import { useTranslation } from 'react-i18next';
import useLogout from '../hooks/useLogout';

type LogoutButtonProps = ButtonProps;

export default function LogoutButton(props: LogoutButtonProps) {
  const { isSubmitting, logout } = useLogout();
  const { t } = useTranslation();

  const handleLogout = async () => {
    logout();
  };

  return (
    <Button
      loading={isSubmitting}
      onClick={handleLogout}
      className="text-white hover:text-fs-green-600 focus:text-fs-green-600"
      variant="tertiary"
      {...props}
    >
      {t('Logout', 'Logout')}
    </Button>
  );
}
