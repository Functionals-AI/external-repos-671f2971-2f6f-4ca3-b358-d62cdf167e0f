import { Avatar, AvatarFallback, AvatarImage } from '@/ui-components/avatar';
import type { ProviderRecord, ProviderRecordShort } from '@mono/telenutrition/lib/types';

export default function ProviderAvatarAndName({
  provider,
}: {
  provider: ProviderRecordShort & Pick<ProviderRecord, 'npi'>;
}) {
  return (
    <div className="flex col-span-2 gap-x-4 items-center">
      <Avatar className="w-24 h-24">
        <AvatarImage src={provider.photo} />
        <AvatarFallback className="border border-neutral-200 bg-status-green-100">
          {provider.initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col py-2">
        <h3 className="text-base">{provider.name}</h3>
        {provider.npi && <p className="text-neutral-700 text-sm">NPI: {provider.npi}</p>}
      </div>
    </div>
  );
}
