import { cn } from '@/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '.';
import { Button, ButtonVariant } from '../button';
import Icon, { SvgName } from '../icons/Icon';

export type OverflowMenuItem =
  | {
      label: string;
      onClick: () => void;
      type?: 'default' | 'destructive';
      icon?: SvgName;
    }
  | 'separator';

interface OverflowMenuProps {
  items: OverflowMenuItem[];
  type?: 'hover-only' | 'visible';
  buttonVariant?: ButtonVariant;
  showIndicator?: boolean;
}

export default function OverflowMenu({
  items,
  type = 'hover-only',
  buttonVariant = 'quaternary',
  showIndicator,
}: OverflowMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        className={'invisible group-hover:visible group-focus:visible active:visible'}
      >
        <Button
          data-testid="overflow-menu-trigger"
          variant={buttonVariant}
          className={cn(
            'min-w-0 ring-transparent relative',
            type === 'hover-only' ? 'invisible' : 'visible',
            buttonVariant === 'tertiary' && 'px-2',
          )}
        >
          {showIndicator && (
            <div
              data-testid="overflow-indicator"
              className="absolute right-0 top-0 w-2 h-2 bg-rose-400 rounded-xl"
            />
          )}
          <Icon name={'meatballs'} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent data-testid="dropdown-menu-content" align="end">
        <RenderOverflowMenuItems items={items} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function RenderOverflowMenuItems({ items }: { items: OverflowMenuItem[] }) {
  return (
    <>
      {items.map((item, index) =>
        item === 'separator' ? (
          <DropdownMenuSeparator key={`separator${index}`} />
        ) : (
          <DropdownMenuItem onClick={item.onClick} key={item.label} type={item.type}>
            {item.icon && <Icon name={item.icon} size={'sm'} className="mr-1" />}
            {item.label}
          </DropdownMenuItem>
        ),
      )}
    </>
  );
}
