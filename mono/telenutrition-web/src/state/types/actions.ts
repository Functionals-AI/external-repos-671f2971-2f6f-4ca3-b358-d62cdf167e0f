import React from 'react';
import { UseGetAccountReturn } from '../../api/account/useGetAccount';
import { Modal } from './modal';
import { PostAuthReturn } from '../../api/auth/types';

type ResponsiveConfig = {
  mobile: React.ReactNode;
  desktop: React.ReactNode;
};

export function isResponsiveConfig(
  config: React.ReactNode | ResponsiveConfig,
): config is ResponsiveConfig {
  return config !== null && typeof config === 'object' && 'mobile' in config && 'desktop' in config;
}

export type HeaderLayoutConfig = {
  leftButtons?: React.ReactNode | ResponsiveConfig;
  rightButtons?: React.ReactNode | ResponsiveConfig;
  mainButtons?: React.ReactNode | ResponsiveConfig;
  hideLogout?: { mobile: boolean; desktop: boolean };
  hideLanguageSelector?: { mobile: boolean; desktop: boolean };
};

export type Action =
  | { type: 'SET_MODAL'; payload: Modal }
  | { type: 'REVEAL_MODAL' }
  | { type: 'CLOSE_MODAL' }
  | { type: 'CLEAR_MODAL' }
  | { type: 'SET_CID'; payload: string }
  | { type: 'APP_USER_FETCHED'; payload: UseGetAccountReturn }
  | { type: 'APP_USER_INVALIDATED' }
  | { type: 'LOGOUT' }
  | { type: 'LOGIN'; payload: PostAuthReturn }
  | { type: 'API_UNAUTHORIZED' }
  | { type: 'SET_HEADER_CONFIG'; payload: HeaderLayoutConfig }
  | { type: 'RESET_HEADER_CONFIG' }
  | { type: 'AUTH_FETCH_ATTEMPTED' }
  | { type: 'APP_CONSENT_SUCCESS' };
