import { DeveloperError } from '../utils/errors';
import { AppState } from './types';
import { Action } from './types/actions';

export const defaultState: AppState = {
  modal: {
    modal: null,
    isOpen: false,
  },
  cid: null,
  showUnauthorizedPage: false,
  headerLayoutConfig: null,
  auth: null,
};

function reducer(prevState: AppState, action: Action): AppState {
  if (action.type === 'APP_CONSENT_SUCCESS') {
    if (!prevState.auth?.loggedIn || !prevState.auth.appUser) return prevState;
    return {
      ...prevState,
      auth: {
        ...prevState.auth,
        appUser: {
          ...prevState.auth.appUser,
          hasAppConsent: true,
        },
      },
    };
  }
  if (action.type === 'AUTH_FETCH_ATTEMPTED') {
    return {
      ...prevState,
      auth: { loggedIn: false },
    };
  }
  if (action.type === 'LOGOUT') {
    return {
      ...prevState,
      auth: { loggedIn: false },
    };
  }
  if (action.type === 'LOGIN') {
    return {
      ...prevState,
      auth: { loggedIn: true, info: action.payload },
    };
  }
  if (action.type === 'APP_USER_FETCHED') {
    if (!prevState.auth?.loggedIn) {
      throw new DeveloperError('Cannot fetch app user if not logged in');
    }
    return {
      ...prevState,
      auth: {
        ...prevState.auth,
        appUser: {
          ...action.payload,
          invalidated: false
        }
      },
    };
  }
  if (action.type === 'APP_USER_INVALIDATED') {
    if (prevState.auth?.loggedIn && prevState.auth.appUser) {
      return {
        ...prevState,
        auth: {
          ...prevState.auth,
          appUser: {
            ...prevState.auth.appUser,
            invalidated: true
          }
        }
      }
    }
  }
  if (action.type === 'SET_MODAL') {
    return {
      ...prevState,
      modal: {
        isOpen: false,
        modal: action.payload,
      },
    };
  }
  if (action.type === 'REVEAL_MODAL') {
    return {
      ...prevState,
      modal: {
        ...prevState.modal,
        isOpen: true,
      },
    };
  }
  if (action.type === 'CLOSE_MODAL') {
    return {
      ...prevState,
      modal: { ...prevState.modal, isOpen: false },
    };
  }
  if (action.type === 'CLEAR_MODAL') {
    return {
      ...prevState,
      modal: { isOpen: false, modal: null },
    };
  }
  if (action.type === 'SET_CID') {
    return {
      ...prevState,
      cid: action.payload,
    };
  }
  if (action.type === 'API_UNAUTHORIZED') {
    return {
      ...prevState,
      showUnauthorizedPage: true,
    };
  }
  if (action.type === 'SET_HEADER_CONFIG') {
    return {
      ...prevState,
      headerLayoutConfig: action.payload,
    };
  }
  if (action.type === 'RESET_HEADER_CONFIG') {
    return {
      ...prevState,
      headerLayoutConfig: null,
    };
  }
  return prevState;
}

export default reducer;
