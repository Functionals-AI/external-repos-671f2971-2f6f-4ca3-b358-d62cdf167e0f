export type FeatureFlag =
  | 'provider_dashboard_0_9_improvements_DEV_16908'
  | 'provider_in_session_0_9_DEV_16928'
  | 'provider_reschedule_with_other_provider_DEV_17175'
  | 'thorough_scheduling_flow_ENG_1629'
  | 'provider_performance_metrics_ENG_1736'
  | 'intercom_ENG_2121'
  | 'coverage_visibility_ENG_2371'
  | 'paginated_patients_page_ENG_2653';

export type FeatureFlagDataMap = Record<FeatureFlag, FeatureFlagData>;
export type FeatureState = 'on' | 'off';
export type FeatureFlagData = {
  key: FeatureFlag;
  name: string;
  featureList: string[];
  defaultValue: FeatureState;
};

export const featureFlagData: FeatureFlagDataMap = {
  provider_dashboard_0_9_improvements_DEV_16908: {
    key: 'provider_dashboard_0_9_improvements_DEV_16908',
    name: 'Provider Dashboard Improvements 0.9',
    featureList: [
      'View provider statistics for any day, week, month, and year',
      'Block a time slot both as a one-off, and recurring with notes',
      'Cancel a member visit with reason and notes',
    ],
    defaultValue: 'off',
  },
  provider_in_session_0_9_DEV_16928: {
    key: 'provider_in_session_0_9_DEV_16928',
    name: 'Provider In-Session Page 0.9',
    featureList: ['Engage in session within app with member'],
    defaultValue: 'on',
  },
  provider_reschedule_with_other_provider_DEV_17175: {
    key: 'provider_reschedule_with_other_provider_DEV_17175',
    name: 'Provider Reschedule With Other Provider',
    featureList: ['Reschedule an appointment with another provider (specified RD and time)'],
    defaultValue: 'off',
  },
  thorough_scheduling_flow_ENG_1629: {
    key: 'thorough_scheduling_flow_ENG_1629',
    name: 'New Schedule and Reschedule Flow',
    featureList: [
      'New scheduling flows',
      'Reschedule an appointment with another provider (specified RD and time)',
    ],
    defaultValue: 'on',
  },
  provider_performance_metrics_ENG_1736: {
    key: 'provider_performance_metrics_ENG_1736',
    name: 'Provider Performance Metrics',
    featureList: ['View provider performance metrics tab'],
    defaultValue: 'on',
  },
  intercom_ENG_2121: {
    key: 'intercom_ENG_2121',
    name: 'Intercom integration on provider',
    featureList: ['Add intercom integration for providers'],
    defaultValue: 'on',
  },
  coverage_visibility_ENG_2371: {
    key: 'coverage_visibility_ENG_2371',
    name: 'Detailed info on account coverage',
    featureList: ['View account coverage on encounter page'],
    defaultValue: 'on',
  },
  paginated_patients_page_ENG_2653: {
    key: 'paginated_patients_page_ENG_2653',
    name: 'Real pagination on patients page',
    featureList: ['improve patient page performance'],
    defaultValue: 'off',
  },
};
