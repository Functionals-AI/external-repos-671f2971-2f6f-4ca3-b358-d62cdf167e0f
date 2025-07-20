import Card from '../card';
import { ReactNode } from 'react';

export default function DataCardPair({ label, value, dataTestId }: { label: string; value: string | ReactNode, dataTestId?: string }) {
  return (
    <Card.Row dataTestId={dataTestId}>
      <Card.Row.Label className="w-32 bg-neutral-115">{label}</Card.Row.Label>
      <Card.Row.Col className="px-2 py-1">{value}</Card.Row.Col>
    </Card.Row>
  );
}
