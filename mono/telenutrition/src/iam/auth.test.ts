import { IContext } from '@mono/common/lib/context';
import { buildFederationScheduleLink, buildFederationToken } from './auth';
import { FederationSource } from './types';
import { set } from 'lodash'

describe("buildFederationToken", () => {
  it('returns a jwt.', async () => {
    const mockContext = {} as IContext;
    set(mockContext, 'config.telenutrition.scheduling.auth.call_center_token_secret', 'secret')

    const result = buildFederationToken(mockContext, '', FederationSource.CallCenter, { userId: 0 })

    expect(result._unsafeUnwrap()).toMatch(/^([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_\-\+\/=]*)/);
  });
});

describe("buildFederationScheduleLink", () => {
  const mockContext = {} as IContext
  set(mockContext, 'config.telenutrition_web.baseUrl', 'http://base-url.com')
  set(mockContext, 'config.telenutrition.scheduling.auth.call_center_token_secret', 'secret')
  set(mockContext, 'config.telenutrition.enrollment.secret', 'secret')

  it('returns a url with just a federated token when the userId is provided', async () => {
    const result = await buildFederationScheduleLink(mockContext, '', FederationSource.CallCenterAgent, { userId: 0, accountId: 0 })
    const url = new URL(result._unsafeUnwrap())

    expect(url.searchParams.has('token')).toBeTruthy();
    expect(url.searchParams.has('enrollment')).toBeFalsy();
  });

  it('returns a url with just a federated token when the accountId is not provided', async () => {
    const result = await buildFederationScheduleLink(mockContext, '', FederationSource.CallCenterAgent, {})
    const url = new URL(result._unsafeUnwrap())

    expect(url.searchParams.has('token')).toBeTruthy();
    expect(url.searchParams.has('enrollment')).toBeFalsy();
  });

  it('returns a url with both a federated token and enrollment token when no userId is provided, but an accountId is provided.', async () => {
    const result = await buildFederationScheduleLink(mockContext, '', FederationSource.CallCenterAgent, { accountId: 0 })
    const url = new URL(result._unsafeUnwrap())

    expect(url.searchParams.has('token')).toBeTruthy();
    expect(url.searchParams.has('enrollment')).toBeTruthy();
  });
});
