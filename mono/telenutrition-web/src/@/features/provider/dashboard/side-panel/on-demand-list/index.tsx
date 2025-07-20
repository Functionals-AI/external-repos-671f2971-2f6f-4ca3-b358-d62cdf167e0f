import OnDemandSlot from './on-demand-slot';
import { useSidePanelContext } from '../context';

export default function OnDemandList() {
  const { filteredOverbookingSlots } = useSidePanelContext();

  return (
    <div className="mt-2">
      {(filteredOverbookingSlots ?? []).map(({ vacancy, slot }) => {
        return (
          <OnDemandSlot
            key={`${vacancy.startTimestamp}-${vacancy.duration}`}
            vacancy={vacancy}
            available={!!slot}
          />
        );
      })}
    </div>
  );
}
