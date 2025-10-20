import { Outlet } from 'react-router-dom';

import { AppFrame } from '../../layout/AppFrame';

export function MerchantApp() {
  return (
    <AppFrame
      basePath="/mx"
      userIdentity={{ name: 'B2BPaymentsPlus', detail: 'Taylor Price', initials: 'TP' }}
      environmentBreadcrumbs={[
        { label: 'Experience switcher', path: '/' },
        { label: 'Merchant admin', path: '/mx' },
      ]}
    >
      <Outlet />
    </AppFrame>
  );
}
