import { NotificationCenter } from '@affine/component';
import { GlobalServerService } from '@affine/core/modules/cloud';
import { FrameworkScope, useService } from '@toeverything/infra';
import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { GlobalDialogs } from '../../dialogs';
import { CustomThemeModifier } from './custom-theme';
import { FindInPageModal } from './find-in-page/find-in-page-modal';

export const RootWrapper = () => {
  const globalServerService = useService(GlobalServerService);
  const [isServerReady, setIsServerReady] = useState(false);

  useEffect(() => {
    if (isServerReady) {
      return;
    }
    const abortController = new AbortController();
    globalServerService.server
      .waitForConfigRevalidation(abortController.signal)
      .then(() => {
        setIsServerReady(true);
      })
      .catch(error => {
        console.error(error);
      });
    return () => {
      abortController.abort();
    };
  }, [globalServerService, isServerReady]);

  return (
    <FrameworkScope scope={globalServerService.server.scope}>
      <GlobalDialogs />
      <NotificationCenter />
      <Outlet />
      <CustomThemeModifier />
      {BUILD_CONFIG.isElectron && <FindInPageModal />}
    </FrameworkScope>
  );
};
