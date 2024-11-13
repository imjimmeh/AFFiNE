import { apis } from '@affine/electron-api';

import { share } from '../../connection';
import { type DocClock, SyncStorage } from '../../storage';
import { NativeDBConnection } from './db';

export class SqliteSyncStorage extends SyncStorage {
  override connection = share(
    new NativeDBConnection(this.spaceType, this.spaceId)
  );

  get db() {
    if (!apis) {
      throw new Error('Not in electron context.');
    }

    return apis.nbstore;
  }

  override async getPeerClocks(peer: string) {
    return this.db.getPeerClocks(this.spaceType, this.spaceId, peer);
  }

  override async setPeerClock(peer: string, clock: DocClock) {
    await this.db.setPeerClock(this.spaceType, this.spaceId, peer, clock);
  }

  override async getPeerPushedClocks(peer: string) {
    return this.db.getPeerPushedClocks(this.spaceType, this.spaceId, peer);
  }

  override async setPeerPushedClock(peer: string, clock: DocClock) {
    await this.db.setPeerPushedClock(this.spaceType, this.spaceId, peer, clock);
  }

  override async clearClocks() {
    await this.db.clearClocks(this.spaceType, this.spaceId);
  }
}
