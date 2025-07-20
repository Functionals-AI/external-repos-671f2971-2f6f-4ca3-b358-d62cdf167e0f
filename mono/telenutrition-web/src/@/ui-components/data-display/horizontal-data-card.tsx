import Card from '../card';

function HorizontalDataCard({ children }: { children: React.ReactNode }) {
  return <Card className="p-0 flex flex-1">{children}</Card>;
}

interface MetricProps {
  title: string;
  data: string;
  footer: string;
}

export function Metric({ title, data, footer }: MetricProps) {
  return (
    <div className="flex-1 border-r border-r-neutral-150 last:border-r-transparent px-4 py-2">
      <h3 className="text-lg">{title}</h3>
      <p className="text-4xl text-fs-green-300">{data}</p>
      <p className="text-[#7A7C7B] leading-6 text-base">{footer}</p>
    </div>
  );
}

HorizontalDataCard.Metric = Metric;

export default HorizontalDataCard;
