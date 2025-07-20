import SessionForm from '../components/session-form';
import { useSessionContext } from '../useSessionContext';
import Card from '@/ui-components/card';
import SessionPatientDisplay from '../components/session-patient-display';

export default function InSession() {
  const { data } = useSessionContext();
  const { encounterData } = data;

  return (
    <>
      <div className="flex flex-col md:flex-row flex-1 gap-4 h-full">
        <SessionPatientDisplay />
        <Card className="flex w-full max-h-[80vh] h-full" style={{ flex: 4 }}>
          <SessionForm config={encounterData.chartingConfig.config} />
        </Card>
      </div>
    </>
  );
}
