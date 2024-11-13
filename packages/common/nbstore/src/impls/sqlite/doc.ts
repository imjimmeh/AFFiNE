import { apis } from '@affine/electron-api';

import { share } from '../../connection';
import { DocStorage, type DocUpdate } from '../../storage';
import { NativeDBConnection } from './db';

export class SqliteDocStorage extends DocStorage {
  get name() {
    return 'sqlite';
  }

  override connection = share(
    new NativeDBConnection(this.spaceType, this.spaceId)
  );

  get db() {
    if (!apis) {
      throw new Error('Not in electron context.');
    }

    return apis.nbstore;
  }

  override async getDoc(docId: string) {
    return this.db.getDoc(this.spaceType, this.spaceId, docId);
  }

  override async pushDocUpdate(update: DocUpdate) {
    return this.db.pushDocUpdate(this.spaceType, this.spaceId, update);
  }

  override async deleteDoc(docId: string) {
    return this.db.deleteDoc(this.spaceType, this.spaceId, docId);
  }

  override async getDocTimestamps(after?: Date) {
    return this.db.getDocTimestamps(
      this.spaceType,
      this.spaceId,
      after ? new Date(after) : undefined
    );
  }

  protected override async getDocSnapshot() {
    // handled in db
    // see electron/src/helper/nbstore/doc.ts
    return null;
  }

  protected override async setDocSnapshot(): Promise<boolean> {
    // handled in db
    return true;
  }

  protected override async getDocUpdates() {
    // handled in db
    return [];
  }

  protected override markUpdatesMerged() {
    // handled in db
    return Promise.resolve(0);
  }
}
