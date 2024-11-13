import { apis, events } from '@affine/electron-api';

import { Connection, type ConnectionStatus } from '../../connection';
import type { SpaceType } from '../../storage';

export class NativeDBConnection extends Connection<void> {
  constructor(
    private readonly spaceType: SpaceType,
    private readonly spaceId: string
  ) {
    super();
    this.listenToConnectionEvents();
  }

  override get shareId(): string {
    return `sqlite:${this.spaceType}:${this.spaceId}`;
  }

  override async doConnect() {
    await apis?.nbstore.connect(this.spaceType, this.spaceId);
  }

  override async doDisconnect() {
    await apis?.nbstore.close(this.spaceType, this.spaceId);
  }

  private listenToConnectionEvents() {
    events?.nbstore.onConnectionStatusChanged(
      ({ spaceType, spaceId, status, error }) => {
        if (spaceType === this.spaceType && spaceId === this.spaceId) {
          this.setStatus(status as ConnectionStatus, error);
        }
      }
    );
  }
}
