import { Trans } from 'react-i18next';
import DialogModal from './dialog';
import ButtonBar from '@/ui-components/button/group';
import { Button } from '@/ui-components/button';
import { useSpecificModalContext } from '../context';

export default function PromptProviderLoginModal() {
  const modal = useSpecificModalContext();

  function openLoginNewWindow() {
    window.open(`/schedule/provider/login?q=1`, '_blank');
  }

  return (
    <DialogModal
      {...{
        type: 'dialog',
        title: <Trans>Login session expired</Trans>,
        body: (
          <p>
            <Trans>
              You&apos;re not logged in. Click &quot;Go to Login&quot; to sign in, then return here
              and close this window to continue.
            </Trans>
          </p>
        ),
        footer: (
          <ButtonBar className="justify-end">
            <ButtonBar.Group>
              <Button onClick={() => modal.closeModal()} variant="tertiary">
                <Trans>Close window</Trans>
              </Button>
              <Button leftIcon={{ name: 'external-link' }} onClick={openLoginNewWindow}>
                <Trans>Go to login</Trans>
              </Button>
            </ButtonBar.Group>
          </ButtonBar>
        ),
      }}
    />
  );
}
