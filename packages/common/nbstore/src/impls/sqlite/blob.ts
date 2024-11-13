import { apis } from '@affine/electron-api';

import { share } from '../../connection';
import { type BlobRecord, BlobStorage } from '../../storage';
import { NativeDBConnection } from './db';

export class SqliteBlobStorage extends BlobStorage {
  override connection = share(
    new NativeDBConnection(this.spaceType, this.spaceId)
  );

  get db() {
    if (!apis) {
      throw new Error('Not in electron context.');
    }

    return apis.nbstore;
  }

  override async get(key: string) {
    return this.db.getBlob(this.spaceType, this.spaceId, key);
  }

  override async set(blob: BlobRecord) {
    await this.db.setBlob(this.spaceType, this.spaceId, blob);
  }

  override async delete(key: string, permanently: boolean) {
    await this.db.deleteBlob(this.spaceType, this.spaceId, key, permanently);
  }

  override async release() {
    await this.db.releaseBlobs(this.spaceType, this.spaceId);
  }

  override async list() {
    return this.db.listBlobs(this.spaceType, this.spaceId);
  }
}
