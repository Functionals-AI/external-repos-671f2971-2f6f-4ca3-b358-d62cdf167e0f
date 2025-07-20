export type DrawerData = ExampleDrawerData | PatientQuickViewDrawerData;

export type ExampleDrawerData = {
  type: 'example';
};

export type PatientQuickViewDrawerData = {
  type: 'patient-quick-view';
  patientId: number;
};

export type DrawerState<T extends DrawerData = DrawerData> = {
  isOpen: boolean;
  drawer: T | null;
  openDrawer: (drawer: DrawerData) => void;
  closeDrawer: () => void;
};

export type OpenDrawerState<T extends DrawerData> = Omit<DrawerState<T>, 'drawer'> & {
  drawer: NonNullable<DrawerState<T>['drawer']>;
};
