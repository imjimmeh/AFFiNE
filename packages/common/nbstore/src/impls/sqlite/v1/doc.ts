import { apis } from '@affine/electron-api';

import { DummyConnection, share } from '../../../connection';
import {
  type DocRecord,
  DocStorage,
  type DocStorageOptions,
  type DocUpdate,
} from '../../../storage';

interface SqliteV1DocStorageOptions extends DocStorageOptions {
  dbPath: string;
}

/**
 * @deprecated readonly
 */
export class SqliteV1DocStorage extends DocStorage<SqliteV1DocStorageOptions> {
  override connection = share(new DummyConnection());

  get name() {
    return 'sqlite(old)';
  }

  get db() {
    if (!apis) {
      throw new Error('Not in electron context.');
    }

    return apis.db;
  }

  override async pushDocUpdate(update: DocUpdate) {
    // no more writes

    return { docId: update.docId, timestamp: new Date() };
  }

  override async getDoc(docId: string) {
    const bin = await this.db.getDocAsUpdates(
      this.spaceType,
      this.spaceId,
      docId
    );

    return {
      docId,
      bin,
      timestamp: new Date(),
    };
  }

  override async deleteDoc(docId: string) {
    await this.db.deleteDoc(this.spaceType, this.spaceId, docId);
  }

  protected override async getDocSnapshot() {
    return null;
  }

  override async getDocTimestamps() {
    return {};
  }

  protected override async setDocSnapshot(): Promise<boolean> {
    return false;
  }

  protected override async getDocUpdates(): Promise<DocRecord[]> {
    return [];
  }

  protected override async markUpdatesMerged(): Promise<number> {
    return 0;
  }
}
