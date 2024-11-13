import {
  type BlobRecord,
  type DocClock,
  type DocUpdate,
  SpaceStorage,
  type SpaceType,
  type StorageType,
} from '@affine/nbstore';
import { Subject } from 'rxjs';

import { logger } from '../logger';
import type { MainEventRegister } from '../type';
import { SqliteBlobStorage } from './blob';
import { SqliteDocStorage } from './doc';
import { SqliteSyncStorage } from './sync';

const STORE_CACHE = new Map<string, SpaceStorage>();
const CONNECTION$ = new Subject<{
  spaceType: SpaceType;
  spaceId: string;
  storage: StorageType;
  status: string;
  error?: Error;
}>();

process.on('beforeExit', () => {
  CONNECTION$.complete();
  STORE_CACHE.forEach(store => {
    store.destroy().catch(err => {
      logger.error('[nbstore] destroy store failed', err);
    });
  });
});

async function ensureStore(spaceType: SpaceType, spaceId: string) {
  const cacheId = `${spaceType}:${spaceId}`;
  let store = STORE_CACHE.get(cacheId);

  if (!store) {
    store = new SpaceStorage([
      new SqliteDocStorage({
        type: spaceType,
        id: spaceId,
      }),
      new SqliteBlobStorage({
        type: spaceType,
        id: spaceId,
      }),
      new SqliteSyncStorage({
        type: spaceType,
        id: spaceId,
      }),
    ]);

    store.on('connection', ({ storage, status, error }) => {
      CONNECTION$.next({ spaceType, spaceId, storage, status, error });
      logger.info(
        `[nbstore] status changed: ${status}, spaceType: ${spaceType}, spaceId: ${spaceId}, storage: ${storage}`
      );
      if (error) {
        logger.error(`[nbstore] connection error: ${error}`);
      }
    });

    await store.connect();

    STORE_CACHE.set(cacheId, store);
  }

  return store;
}

export const nbstoreHandlers = {
  connect: async (spaceType: SpaceType, spaceId: string) => {
    await ensureStore(spaceType, spaceId);
  },

  close: async (spaceType: SpaceType, spaceId: string) => {
    const store = STORE_CACHE.get(`${spaceType}:${spaceId}`);
    if (store) {
      await store.disconnect();
      // The store may be shared with other tabs, so we don't delete it from cache
      // the underlying connection will handle the close correctly
      // STORE_CACHE.delete(`${spaceType}:${spaceId}`);
    }
  },

  pushDocUpdate: async (
    spaceType: SpaceType,
    spaceId: string,
    update: DocUpdate
  ) => {
    const store = await ensureStore(spaceType, spaceId);
    return store.get('doc').pushDocUpdate(update);
  },

  getDoc: async (spaceType: SpaceType, spaceId: string, docId: string) => {
    const store = await ensureStore(spaceType, spaceId);
    return store.get('doc').getDoc(docId);
  },

  deleteDoc: async (spaceType: SpaceType, spaceId: string, docId: string) => {
    const store = await ensureStore(spaceType, spaceId);
    return store.get('doc').deleteDoc(docId);
  },

  getDocTimestamps: async (
    spaceType: SpaceType,
    spaceId: string,
    after?: Date
  ) => {
    const store = await ensureStore(spaceType, spaceId);
    return store.get('doc').getDocTimestamps(after);
  },

  setBlob: async (spaceType: SpaceType, spaceId: string, blob: BlobRecord) => {
    const store = await ensureStore(spaceType, spaceId);
    return store.get('blob').set(blob);
  },

  getBlob: async (spaceType: SpaceType, spaceId: string, key: string) => {
    const store = await ensureStore(spaceType, spaceId);
    return store.get('blob').get(key);
  },

  deleteBlob: async (
    spaceType: SpaceType,
    spaceId: string,
    key: string,
    permanently: boolean
  ) => {
    const store = await ensureStore(spaceType, spaceId);
    return store.get('blob').delete(key, permanently);
  },

  listBlobs: async (spaceType: SpaceType, spaceId: string) => {
    const store = await ensureStore(spaceType, spaceId);
    return store.get('blob').list();
  },

  releaseBlobs: async (spaceType: SpaceType, spaceId: string) => {
    const store = await ensureStore(spaceType, spaceId);
    return store.get('blob').release();
  },

  getPeerClocks: async (
    spaceType: SpaceType,
    spaceId: string,
    peer: string
  ) => {
    const store = await ensureStore(spaceType, spaceId);
    return store.get('sync').getPeerClocks(peer);
  },

  setPeerClock: async (
    spaceType: SpaceType,
    spaceId: string,
    peer: string,
    clock: DocClock
  ) => {
    const store = await ensureStore(spaceType, spaceId);
    return store.get('sync').setPeerClock(peer, clock);
  },

  getPeerPushedClocks: async (
    spaceType: SpaceType,
    spaceId: string,
    peer: string
  ) => {
    const store = await ensureStore(spaceType, spaceId);
    return store.get('sync').getPeerPushedClocks(peer);
  },

  setPeerPushedClock: async (
    spaceType: SpaceType,
    spaceId: string,
    peer: string,
    clock: DocClock
  ) => {
    const store = await ensureStore(spaceType, spaceId);
    return store.get('sync').setPeerPushedClock(peer, clock);
  },

  clearClocks: async (spaceType: SpaceType, spaceId: string) => {
    const store = await ensureStore(spaceType, spaceId);
    return store.get('sync').clearClocks();
  },
};

export const nbstoreEvents = {
  onConnectionStatusChanged: (
    fn: (payload: {
      spaceType: SpaceType;
      spaceId: string;
      storage: StorageType;
      status: string;
      error?: Error;
    }) => void
  ) => {
    const sub = CONNECTION$.subscribe({
      next: fn,
    });
    return () => {
      sub.unsubscribe();
    };
  },
} satisfies Record<string, MainEventRegister>;
