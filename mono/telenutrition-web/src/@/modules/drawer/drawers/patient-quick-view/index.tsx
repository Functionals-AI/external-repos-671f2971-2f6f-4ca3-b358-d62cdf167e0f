import Drawer from 'react-modern-drawer';
import { PatientQuickViewDrawerData, OpenDrawerState } from '../../types';

import IconButton from '@/ui-components/button/icon';
import { Cross1Icon } from '@radix-ui/react-icons';

import 'react-modern-drawer/dist/index.css';
import DataDisplay from '@/ui-components/data-display';
import { useFetchProviderPatientById } from 'api/provider/useGetProviderPatient';
import { Trans } from 'react-i18next';
import ContainerLoading from '@/ui-components/loading/container-loading';
import GetErrorDislpay from '@/modules/errors/get-error-display';
import useMemberHelpers from '@/modules/member/useMemberHelpers';

export default function PatientQuickViewDrawer({
  isOpen,
  closeDrawer,
  drawer,
}: OpenDrawerState<PatientQuickViewDrawerData>) {
  const { data, isLoading, error, refetch } = useFetchProviderPatientById({
    patientId: drawer.patientId,
  });

  const memberHelpers = useMemberHelpers();

  return (
    <Drawer
      open={isOpen}
      onClose={closeDrawer}
      direction="right"
      style={{ width: '420px', overflow: 'auto' }}
    >
      {isLoading ? (
        <ContainerLoading />
      ) : error ? (
        <GetErrorDislpay error={error} refetch={refetch} />
      ) : (
        <>
          <div className="w-full p-4">
            <div className="w-full flex flex-row justify-between">
              <span>
                <Trans>Member Quick View</Trans>
              </span>
              <IconButton
                iconName="crosshair"
                variant="tertiary"
                onClick={closeDrawer}
                className="w-6 h-6"
              />
            </div>
            <h3>{memberHelpers.getDisplayNameForPatient(data.patient).value}</h3>
          </div>

          {/* <Banner
            banner={{
              type: 'warn',
              size: 'small',
              message: '2 sessions remaining',
              description: '',
            }}
          /> */}

          <div className="w-full flex flex-col gap-4 p-4">
            {data.patient.birthday && (
              <DataDisplay label="Birthday" content={data.patient.birthday} />
            )}
            {data.patient.sex && <DataDisplay label="Sex" content={data.patient.sex} />}
            {/* <DataDisplay label="Height" content={`6' 1"`} />
            <PatientWeightSimpleTable isAddable />
            <PatientWeightSimpleTable isAddable />
            <PatientWeightSimpleTable isAddable /> */}
          </div>

          {/* <div className="w-full flex flex-col gap-4 p-4">
            <h4 className="text-lg text-neutral-700 font-bold">Session History</h4>
            <AccordionItem
              header={'09/28/23'}
              icons={<Badge className="h-6">2 modules billed</Badge>}
            >
              <PatientWeightTable direction="horizontal" readOnly />
              <p className="mt-4">
                Notes from the session... Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                Pellentesque urna justo, sagittis ut erat non, ultricies vulputate ex. Nunc sagittis
                dolor ut hendrerit commodo.
              </p>
              <SeeMore title="See full notes">
                <p className="mt-4">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                  incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet,
                  consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
                  magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                  eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
              </SeeMore>
            </AccordionItem>
            <AccordionItem
              header={'09/14/23'}
              icons={<Badge className="h-6">2 modules billed</Badge>}
            >
              <PatientWeightTable direction="horizontal" readOnly />
              <p className="mt-4">
                Notes from the session... Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                Pellentesque urna justo, sagittis ut erat non, ultricies vulputate ex. Nunc sagittis
                dolor ut hendrerit commodo.
              </p>
              <SeeMore title="See full notes" className="mt-4">
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                  incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet,
                  consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
                  magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                  eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
              </SeeMore>
            </AccordionItem>
          </div> */}
        </>
      )}
    </Drawer>
  );
}
