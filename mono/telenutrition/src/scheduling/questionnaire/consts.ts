type Option = {
  label: string;
  value: string;
};

export const interventionOptions: Option[] = [
  { label: 'Weight Loss', value: 'weight-loss' },
  { label: 'Weight Gain', value: 'weight-gain' },
  { label: 'Muscle Gain', value: 'muscle-gain' },
  { label: 'Performance', value: 'performance' },
  { label: 'Other', value: 'other' },
];

export const billingCPTcodeOptions: Option[] = [
  { label: '97802', value: '97802' },
  { label: '97803', value: '97803' },
  { label: '99202', value: '99202' },
  { label: '99203', value: '99203' },
  { label: '99204', value: '99204' },
  { label: '99205', value: '99205' },
  { label: '99212', value: '99212' },
  { label: '99213', value: '99213' },
  { label: '99214', value: '99214' },
  { label: '99215', value: '99215' },
  { label: 'S9470', value: 'S9470' },
];
