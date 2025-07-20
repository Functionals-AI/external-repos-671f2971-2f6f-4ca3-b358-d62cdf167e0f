import { cn } from '@/utils';
import RadioIcon from '../radio-and-checkbox/radio-icon';
import { Checkbox } from '../checkbox';
// On keydown when using this component, it will auto focus the first element... we don't want that but don't know how to disable it
// import { DropdownMenuItem } from '@radix-ui/react-dropdown-menu';

interface Props {
  selected: boolean;
  label: string;
  value: string | number;
  onClick: () => void;
  multiple?: boolean;
}

export default function FilterOption({ selected, label, value, onClick, multiple }: Props) {
  return (
    <div
      className={cn(
        'flex items-center px-3 py-2 select-none cursor-pointer',
        'hover:bg-fs-green-100 data-[selected]:!bg-fs-green-600 data-[selected]:!text-white',
        'data-[disabled]:opacity-50 cursor-pointer',
        selected && 'bg-fs-green-50',
      )}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      <div className="w-4 mr-2">
        {multiple ? (
          <Checkbox checked={selected} />
        ) : (
          <RadioIcon variant={selected ? 'checked' : 'default'} />
        )}
      </div>
      <div className="w-full">{label}</div>
    </div>
  );
}
