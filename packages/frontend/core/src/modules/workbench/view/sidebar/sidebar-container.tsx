import { Scrollable } from '@affine/component';
import { useLiveData, useService } from '@toeverything/infra';
import clsx from 'clsx';
import { useCallback } from 'react';

import { ViewService } from '../../services/view';
import { WorkbenchService } from '../../services/workbench';
import { ViewSidebarTabBodyTarget } from '../view-islands';
import * as styles from './sidebar-container.css';
import { Header } from './sidebar-header';
import { SidebarHeaderSwitcher } from './sidebar-header-switcher';

const SidebarContentWrapper = ({
  scrollable,
  children,
}: React.PropsWithChildren<{ scrollable?: boolean }>) => {
  return scrollable ? (
    <Scrollable.Root className={styles.sidebarBodyScrollable}>
      <Scrollable.Viewport>{children}</Scrollable.Viewport>
      <Scrollable.Scrollbar />
    </Scrollable.Root>
  ) : (
    children
  );
};

export const SidebarContainer = ({
  className,
  ...props
}: React.HtmlHTMLAttributes<HTMLDivElement>) => {
  const workbenchService = useService(WorkbenchService);
  const workbench = workbenchService.workbench;
  const viewService = useService(ViewService);
  const view = viewService.view;
  const sidebarTabs = useLiveData(view.sidebarTabs$);
  const activeSidebarTab = useLiveData(view.activeSidebarTab$);

  const handleToggleOpen = useCallback(() => {
    workbench.toggleSidebar();
  }, [workbench]);

  const contentScrollable = activeSidebarTab?.scrollable;

  return (
    <div
      className={clsx(styles.sidebarContainerInner, className)}
      data-scrollable={contentScrollable}
      {...props}
    >
      <Header onToggle={handleToggleOpen}>
        <SidebarHeaderSwitcher />
      </Header>
      <SidebarContentWrapper scrollable={contentScrollable}>
        {sidebarTabs.length > 0 ? (
          sidebarTabs.map(sidebar => (
            <ViewSidebarTabBodyTarget
              tabId={sidebar.id}
              key={sidebar.id}
              style={{
                display: activeSidebarTab === sidebar ? 'block' : 'none',
              }}
              viewId={view.id}
              className={clsx(
                styles.sidebarBodyTarget,
                !BUILD_CONFIG.isElectron && styles.borderTop
              )}
              data-testid={`sidebar-tab-content-${sidebar.id}`}
            />
          ))
        ) : (
          <div className={styles.sidebarBodyNoSelection}>No Selection</div>
        )}
      </SidebarContentWrapper>
    </div>
  );
};
