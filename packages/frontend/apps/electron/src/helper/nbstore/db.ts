import { DocStorage as NativeDocStorage } from '@affine/native';
import { Connection, type SpaceType } from '@affine/nbstore';

import { logger } from '../logger';
import { getWorkspaceMeta } from '../workspace/meta';

export class NativeDBConnection extends Connection<NativeDocStorage> {
  constructor(
    private readonly spaceType: SpaceType,
    private readonly workspaceId: string
  ) {
    super();
  }

  override get shareId(): string {
    return `sqlite:${this.spaceType}:${this.workspaceId}`;
  }

  override async doConnect() {
    const meta = await getWorkspaceMeta(this.spaceType, this.workspaceId);
    const conn = new NativeDocStorage(meta.mainDBPath);
    await conn.init();
    logger.info('[nbstore] connection established', this.shareId);
    return conn;
  }

  override async doDisconnect(conn: NativeDocStorage) {
    await conn.close();
    logger.info('[nbstore] connection closed', this.shareId);
  }
}
