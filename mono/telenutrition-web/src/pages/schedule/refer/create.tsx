import ReferralFlowWrapper from '../../../modules/referral/flow-wrapper';
import AllowRoles from '../../../route-guards/allow-roles';

export default function CreateReferralPage() {
  return (
    <AllowRoles
      allowedRoles={['referrer', 'delegate']}
      redirectOnNoToken={'/schedule/auth/referrer'}
    >
      <ReferralFlowWrapper />
    </AllowRoles>
  );
}
