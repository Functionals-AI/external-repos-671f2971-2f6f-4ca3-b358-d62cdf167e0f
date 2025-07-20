import { Button } from '@/ui-components/button';
import { TimerButtonAction, TimerState } from './visit-timer';
import { Trans } from 'react-i18next';
import Icon from '@/ui-components/icons/Icon';
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui-components/tooltip';

interface TimerButtonProps {
  state: TimerState;
  onClick: (newState: TimerButtonAction) => void;
  disabled?: boolean;
  tooltip?: string;
}

export default function TimerButton({ state, onClick, disabled, tooltip }: TimerButtonProps) {
  if (['running', 'good', 'over'].includes(state.state)) {
    return (
      <Button
        dataTestId="end-timer-button"
        className="bg-white"
        variant="secondary"
        size="sm"
        onClick={() => onClick('stop')}
      >
        <Icon name="stop-circle" size="sm" />
        <Trans>End Timer</Trans>
      </Button>
    );
  } else {
    if (state.endTime) {
      return (
        <Button
          dataTestId="disabled-timer-button"
          disabled
          className="opacity-60 select-none"
          variant="secondary"
          size="sm"
        >
          <Icon name="stop-circle" size="sm" />
          <Trans>Ended</Trans>
        </Button>
      );
    } else {
      const startVisitButtonn = (
        <Button
          disabled={disabled}
          dataTestId="start-encounter-button"
          variant="primary"
          size="sm"
          onClick={() => onClick('start')}
        >
          <Icon name="play-circle" color="white" size="sm" />
          <Trans>Start visit</Trans>
        </Button>
      );
      return tooltip ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger disabled={disabled}>{startVisitButtonn}</TooltipTrigger>
            <TooltipContent>
              <p>{tooltip}</p>
              <TooltipArrow className="fill-neutral-1500" />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        startVisitButtonn
      );
    }
  }
}
