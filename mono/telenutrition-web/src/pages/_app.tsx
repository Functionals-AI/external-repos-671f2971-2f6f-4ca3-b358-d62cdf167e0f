import 'styles/globals.css';

import Head from 'next/head';
import { AppStateProvider } from '../state/context';
import reducer, { defaultState } from '../state/reducer';
import { useEnhancedReducer } from '../hooks/useEnhancedReducer';
import React, { useEffect } from 'react';
import ModalManager from '../modules/modal/manager';
import { v4 as uuidv4 } from 'uuid';
import Script from 'next/script';
import { ProSidebarProvider } from 'react-pro-sidebar';
import i18n from '../utils/i18n';
import { I18nextProvider } from 'react-i18next';
import LanguageHandler from '../components/language-handler';
import ErrorBoundary from '../components/error-boundary';
import UnauthorizedBoundary from '../components/unauthorized-boundary';
import PageEventLogger from '../components/page-event-logger';
import BasicLayout from '../components/layouts/basic';
import { useRouter } from 'next/router';
import localStorageHelpers from '../utils/localStorageHelpers';
import DelegateAuthHandler from '../components/delegate-auth-handler';
import CheckAutoLogout from '../components/check-auto-logout';
import AuthInfoLoader from '../components/auth-info-loader';
import axios from 'axios';
import { PostAuthReturn, isResponsePostAuthReturn } from 'api/auth/types';
import { ApiResponsePayload, ApiResponseSuccessPayload } from 'api/client';
import { UseFetchCacheProvider } from 'hooks/useFetch/context';
import { ModalManager as ModalManagerV2, ModalProvider } from '@/modules/modal';
import { Toaster } from 'react-hot-toast';
import { PiiDisplayContext } from '@/modules/pii-manager/context';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID; // Google Analytics Measurement ID

type MyAppProps = {
  Component: any;
  pageProps: any;
};

const MyApp = ({ Component, pageProps }: MyAppProps) => {
  const router = useRouter();

  const [appState, dispatch, getAppState] = useEnhancedReducer(reducer, defaultState);

  // Generate or get CID
  useEffect(() => {
    const existingCid = localStorageHelpers.get('cid');
    if (!existingCid) {
      const newCid = uuidv4();
      dispatch({ type: 'SET_CID', payload: newCid });
      localStorageHelpers.set('cid', newCid);
    } else {
      dispatch({ type: 'SET_CID', payload: existingCid });
    }
  }, []);

  function handleApiError(error: any): Promise<any> {
    console.error(`HTTP ${error.response.status}: ${error.message}`);

    if (error.response && error.response.status === 401) {
      localStorageHelpers.removeToken();
      dispatch({ type: 'LOGOUT' });
      router.push('/schedule/auth/login');
    }

    // Sets global flag to show full-page 403 error
    if (error.response && error.response.status === 403) {
      console.log('error', error);
      dispatch({ type: 'API_UNAUTHORIZED' });
    }

    return Promise.reject(error);
  }

  function handlePostSuccess(path: string, data: ApiResponsePayload): ApiResponsePayload {
    if (
      path.startsWith('/auth') &&
      data.meta.ok &&
      isResponsePostAuthReturn(data as ApiResponseSuccessPayload<PostAuthReturn>)
    ) {
      const authResponse = data as ApiResponseSuccessPayload<PostAuthReturn>;
      dispatch({ type: 'LOGIN', payload: authResponse.data });
    }
    return data;
  }

  return (
    <>
      <Head>
        <title>{i18n.t('FoodsmartSchedulingApp', 'Foodsmart Scheduling App')}</title>
        <meta
          name="description"
          content={
            i18n.t('FoodsmartSchedulingApp', 'Foodsmart Scheduling App') ??
            'Foodsmart Scheduling App'
          }
        />
        <meta
          name="google-site-verification"
          content="kaSV19Kwk8vr2w8-fdoHZClx4medsJRnk5vq0cs8Mww"
        />
        <link rel="icon" href="/favicon.png" />
      </Head>

      {/* <!-- Google Analytics Tags -->  */}
      <Script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
      <Script id="google-analytics-v4" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { 'send_page_view': false });
        `}
      </Script>
      {/* <!-- End Google Analytics Tags --> */}

      <I18nextProvider i18n={i18n}>
        <AppStateProvider.Provider
          value={{
            appState,
            dispatch,
            getAppState,
            handleApiError,
            handlePostSuccess,
          }}
        >
          <UseFetchCacheProvider>
            <PiiDisplayContext.Provider value={{ isPiiHidden: false, setIsPiiHidden: () => {} }}>
              <LanguageHandler>
                <ModalProvider>
                  <ProSidebarProvider>
                    <BasicLayout>
                      {/* <CheckAutoLogout> */}
                      <AuthInfoLoader>
                        {/* <DelegateAuthHandler /> */}
                        <PageEventLogger />
                        <ErrorBoundary>
                          <UnauthorizedBoundary>
                            <Toaster position="top-right" />
                            <Component {...pageProps} />
                            <ModalManager />
                            <ModalManagerV2 />
                          </UnauthorizedBoundary>
                        </ErrorBoundary>
                      </AuthInfoLoader>
                      {/* </CheckAutoLogout> */}
                    </BasicLayout>
                  </ProSidebarProvider>
                </ModalProvider>
              </LanguageHandler>
            </PiiDisplayContext.Provider>
          </UseFetchCacheProvider>
        </AppStateProvider.Provider>
      </I18nextProvider>
    </>
  );
};

////////////////////////////
// https://github.com/facebook/react/issues/11538#issuecomment-417504600
////////////////////////////

function logErrorToApi(message: string, stackTrace: string, cid?: string | null) {
  try {
    axios.post(`${BASE_URL}/scheduling/error`, {
      error: message,
      stackTrace,
      cid,
    });
  } catch (e) {
    if (console) {
      console.error(message, stackTrace);
    }
  }
}

if (typeof Node === 'function' && Node.prototype) {
  let cid: string | undefined | null;
  if (localStorage) {
    cid = localStorage.getItem('cid');
  }

  const originalRemoveChild = Node.prototype.removeChild;
  // @ts-ignore
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) {
      logErrorToApi('Cannot remove a child from a different parent', child.nodeName, cid);
      return child;
    }
    // @ts-ignore
    return originalRemoveChild.apply(this, arguments);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  // @ts-ignore
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      logErrorToApi(
        'Cannot insert before a reference node from a different parent',
        referenceNode.nodeName,
        cid,
      );
      return newNode;
    }
    // @ts-ignore
    return originalInsertBefore.apply(this, arguments);
  };
}

export default MyApp;
