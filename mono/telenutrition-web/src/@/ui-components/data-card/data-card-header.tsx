import Card from '../card';

export default function DataCardHeader({
  label,
  dataTestId,
}: {
  label: string;
  dataTestId?: string;
}) {
  return (
    <Card.Row dataTestId={dataTestId}>
      <Card.Row.Label className="w-full px-2 py-1 bg-neutral-150">{label}</Card.Row.Label>
    </Card.Row>
  );
}
