import * as zs from 'zapatos/schema';
import { excludeOverlappingLicenses } from './providers-and-licenses'
import { orderBy } from 'lodash';
import { mockContext } from '@mono/common/lib/mocks/context'


const mockLicense: zs.telenutrition.provider_license.JSONSelectable = {
  license_id: -1,
  source: 'medallion',
  medallion_id: '',
  candid_provider_credentialing_span_id: '',
  provider_id: -1,
  status: '',
  state: 'FL',
  issue_date: '2000-01-01',
  expiration_date: '2009-01-01',
  license_number: '',
  certificate_type: 'RD',
  created_at: '00-00-00T00:00',
  created_by: '',
  updated_at: '00-00-00T00:00',
  updated_by: '',
  verification_status: null,
  cached_verified_at: null,
  cached_verified_expiration_date: null,
}

describe('excludeOverlappingLicenses', () => {
  it('filters out overlapping licenses that are in the same state, keeping the one with the max expiration_date', async () => {
    const input: zs.telenutrition.provider_license.JSONSelectable[] = [
      {
        ...mockLicense,
        state: 'FL',
        issue_date: '2000-01-01',
        expiration_date: '2009-01-01',
      },
      {
        ...mockLicense,
        state: 'FL',
        issue_date: '2008-01-01',
        expiration_date: '2011-01-01',
      },
      {
        ...mockLicense,
        state: 'FL',
        issue_date: '2009-01-01',
        expiration_date: '2010-01-01',
      }
    ];
    const expected: zs.telenutrition.provider_license.JSONSelectable[] = [input[1]];
    const received = excludeOverlappingLicenses(mockContext, input)._unsafeUnwrap();
    expect(received).toStrictEqual(expected)
  });

  it('keeps all licenses if they are in the same state and do not overlap', async () => {
    const input: zs.telenutrition.provider_license.JSONSelectable[] = [
      {
        ...mockLicense,
        state: 'FL',
        issue_date: '2008-01-01',
        expiration_date: '2010-01-01',
      },
      {
        ...mockLicense,
        state: 'FL',
        issue_date: '2000-01-01',
        expiration_date: '2007-01-01',
      },
    ];
    const expected: zs.telenutrition.provider_license.JSONSelectable[] = orderBy(input, 'expiration_date', 'desc');
    const received = excludeOverlappingLicenses(mockContext, input)._unsafeUnwrap();
    expect(received).toStrictEqual(expected)
  });

  it('does not filter if the licenses are in different states', async () => {
    const input: zs.telenutrition.provider_license.JSONSelectable[] = [
      {
        ...mockLicense,
        state: 'CA',
        issue_date: '2000-01-01',
        expiration_date: '2009-01-01',
      },
      {
        ...mockLicense,
        state: 'FL',
        issue_date: '2008-01-01',
        expiration_date: '2010-01-01',
      }
    ];
    const expected: zs.telenutrition.provider_license.JSONSelectable[] = input;
    const received = excludeOverlappingLicenses(mockContext, input)._unsafeUnwrap();
    expect(received).toStrictEqual(expected)
  });

  it('does not filter if the license is missing one of the dates', async () => {
    const input: zs.telenutrition.provider_license.JSONSelectable[] = [
      {
        ...mockLicense,
        state: 'CA',
        issue_date: '2008-01-01',
        expiration_date: null,
      },
      {
        ...mockLicense,
        state: 'CA',
        issue_date: null,
        expiration_date: null,
      },
      {
        ...mockLicense,
        state: 'CA',
        issue_date: null,
        expiration_date: '2009-01-01',
      }
    ];
    const expected: zs.telenutrition.provider_license.JSONSelectable[] = input;
    const received = excludeOverlappingLicenses(mockContext, input)._unsafeUnwrap();
    expect(received).toStrictEqual(expected)
  });
});
