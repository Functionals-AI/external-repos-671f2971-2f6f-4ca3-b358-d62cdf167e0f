import { cn } from '@/utils';
import { CSSProperties, PropsWithChildren, ReactNode } from 'react';

function Card({
  className,
  children,
  dataTestId,
  style,
}: PropsWithChildren<{ className?: string; dataTestId?: string; style?: CSSProperties }>) {
  return (
    <div
      style={style}
      data-testid={dataTestId}
      className={cn(
        'bg-white border border-border-color-light rounded-md',
        className,
      )}
    >
      {children}
    </div>
  );
}

function Header({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('p-2 bg-neutral-115', className)}>{children}</div>;
}

function Row({
  className,
  children,
  dataTestId,
}: {
  className?: string;
  children: React.ReactNode;
  dataTestId?: string;
}) {
  return (
    <div
      data-testid={dataTestId}
      className={cn('border-b border-b-neutral-150 last:border-b-0 flex', className)}
    >
      {children}
    </div>
  );
}

function Col({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn('border-r border-r-neutral-150 last:border-r-0 text-type-primary', className)}
    >
      {children}
    </div>
  );
}

function Label({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'bg-neutral-115 border-r border-r-border-color-light flex items-center px-2 text-type-secondary',
        className,
      )}
    >
      <h5>{children}</h5>
    </div>
  );
}

function Body({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('p-2', className)}>{children}</div>;
}

Row.Label = Label;
Row.Col = Col;

Card.Header = Header;
Card.Row = Row;
Card.Body = Body;

export default Card;
