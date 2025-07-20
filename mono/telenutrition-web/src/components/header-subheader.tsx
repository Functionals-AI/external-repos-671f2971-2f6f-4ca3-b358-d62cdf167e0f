import { ReactNode } from 'react';

interface HeaderSubheaderProps {
  header?: string | null;
  subheader?: string | ReactNode | null;
  headerSize?: string;
}

export default function HeaderSubheader({
  header,
  subheader,
  headerSize = '3xl',
}: HeaderSubheaderProps) {
  return !!header || !!subheader ? (
    <div>
      {header && (
        <h2 className={`font-extrabold text-neutral-1500 text-${headerSize}`}>{header}</h2>
      )}
      {subheader && <h3 className="font-medium text-neutral-700 text-lg">{subheader}</h3>}
    </div>
  ) : null;
}
