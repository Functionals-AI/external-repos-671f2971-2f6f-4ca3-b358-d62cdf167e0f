import React from 'react';
import Container from '@/ui-components/container';
import PastVisitCard from './past-visit-card';
import { useGetPastEncounters } from 'api/encounter/useGetPastEncounters';
import ContainerLoading from '@/ui-components/loading/container-loading';
import GetErrorDislpay from '@/modules/errors/get-error-display';
import Icon from '@/ui-components/icons/Icon';

export default function PastVisits() {
  const { data, isLoading, error, refetch } = useGetPastEncounters();

  if (isLoading) {
    return <ContainerLoading />;
  }

  if (error) {
    return <GetErrorDislpay refetch={refetch} error={error} />;
  }

  const items = data?.encounters.map((e) => (
    <div key={e.encounterId} className="flex flex-row">
      <div className="ml-5 pl-5 border-l border-l-neutral-600 border-dotted auto hidden sm:block">
        <div
          className="relative w-0 h-0"
          style={{
            left: -32,
            top: 20,
          }}
        >
          <div className="bg-white w-8 h-8">
            <Icon name="calendar" />
          </div>
        </div>
      </div>
      <div className="w-full lg:w-96">
        <PastVisitCard encounter={e} />
      </div>
    </div>
  ));

  return (
    <div>
      <Container>
        <div
          // height should just fit 3 items
          style={{ height: 460 }}
          className="overflow-y-scroll"
        >
          {items}
        </div>
      </Container>
    </div>
  );
}
