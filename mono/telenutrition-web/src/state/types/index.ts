import { Dispatch } from 'react';
import { Action, HeaderLayoutConfig } from './actions';
import { Modal } from './modal';
import { UseGetAccountReturn } from '../../api/account/useGetAccount';
import { PostAuthReturn } from '../../api/auth/types';
import { ApiResponsePayload } from 'api/client';

export type Auth =
  | {
      loggedIn: false;
    }
  | {
      loggedIn: true;
      info: PostAuthReturn;
      appUser?: UseGetAccountReturn & { invalidated?: boolean };
    }


export interface AppState {
  modal: { isOpen: boolean; modal: null | Modal };
  cid: string | null;
  showUnauthorizedPage: boolean;
  headerLayoutConfig: HeaderLayoutConfig | null;
  auth: Auth | null;
}

export interface AppStateContext {
  appState: AppState;
  dispatch: Dispatch<Action>;
  getAppState: () => AppState;
  // Allow app vs pages router to handle api errors differently
  handleApiError: (e: any) => Promise<any>;
  handlePostSuccess: (path: string, data: ApiResponsePayload) => ApiResponsePayload;
}
