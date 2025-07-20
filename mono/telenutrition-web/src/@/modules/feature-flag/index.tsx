'use client';

import { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react';
import { DeveloperError } from 'utils/errors';
import localStorageHelpers from 'utils/localStorageHelpers';
import { FeatureFlag, featureFlagData, FeatureFlagDataMap, FeatureState } from './feature-flags';

export type StandardFeature = 'developer';

export const standardFeatures: StandardFeature[] = ['developer'];

interface FeatureFlags {
  hasFeature: (feature: StandardFeature | FeatureFlag) => boolean;
  featureFlagData: FeatureFlagDataMap;
  getFeatureState: (p: {
    key: FeatureFlag | StandardFeature;
    defaultValue: FeatureState;
  }) => FeatureState;
  updateFlags: (data: Record<FeatureFlag, FeatureState>) => void;
  resetFeatureFlags: () => void;
  getFeatureValues: () => Record<FeatureFlag, FeatureState>;
}

export const FeatureFlagsContext = createContext<FeatureFlags | null>(null);

export function useFeatureFlags(): FeatureFlags {
  const context = useContext(FeatureFlagsContext);
  if (!context) throw new DeveloperError('FeatureFlagsContext.Provider is not given');

  return context;
}

export function FeatureFlagsProvider({ children }: PropsWithChildren<{}>) {
  const [features, setFeatures] = useState<{
    [key in StandardFeature | FeatureFlag]?: FeatureState;
  }>({});

  function getFeatureState({
    key,
    defaultValue,
  }: {
    key: FeatureFlag | StandardFeature;
    defaultValue: FeatureState;
  }): FeatureState {
    if (defaultValue === 'on') {
      return 'on';
    }
    const value = localStorageHelpers.get(key) ?? 'off';
    return value as FeatureState;
  }

  function updateFlags(data: Record<FeatureFlag, FeatureState>) {
    Object.entries(data).forEach(([key, value]) => {
      localStorageHelpers.set(key as FeatureFlag, value as FeatureState);
    });
  }

  function getFeatureValues(): Record<FeatureFlag, FeatureState> {
    return Object.entries(featureFlagData).reduce(
      (acc, [key, data]) => ({
        ...acc,
        [key]: getFeatureState({ key: key as FeatureFlag, defaultValue: data.defaultValue }),
      }),
      {} as Record<FeatureFlag, FeatureState>,
    );
  }

  useEffect(() => {
    const standardFeatureValues = standardFeatures.reduce(
      (acc, key) => ({
        ...acc,
        [key]: getFeatureState({ key, defaultValue: 'off' }),
      }),
      {} as Record<StandardFeature, FeatureState>,
    );

    const featureFlagValues = Object.values(featureFlagData).reduce(
      (acc, data) => ({
        ...acc,
        [data.key]: getFeatureState({ key: data.key, defaultValue: data.defaultValue }),
      }),
      {} as Record<FeatureFlag, FeatureState>,
    );

    setFeatures({ ...standardFeatureValues, ...featureFlagValues });
  }, []);

  function hasFeature(feature: StandardFeature | FeatureFlag) {
    return features[feature] === 'on';
  }

  function resetFeatureFlags() {
    Object.values(featureFlagData).forEach((data) => {
      localStorageHelpers.remove(data.key);
    });
  }

  return (
    <FeatureFlagsContext.Provider
      value={{
        hasFeature,
        featureFlagData,
        getFeatureValues,
        getFeatureState,
        updateFlags,
        resetFeatureFlags,
      }}
    >
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function RequireFeature({
  feature,
  onFail,
  children,
}: PropsWithChildren<{ feature: FeatureFlag | StandardFeature; onFail: () => void }>) {
  const featureFlags = useFeatureFlags();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!featureFlags.hasFeature(feature)) {
      onFail();
    } else {
      setIsLoaded(true);
    }
  }, [featureFlags]);

  return isLoaded ? <>{children}</> : null;
}
