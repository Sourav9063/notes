import type { Config } from '../config.js';
import { GcsStorage } from './gcs.js';
import type { ObjectStorage } from './types.js';

export function createStorage(config: Config): ObjectStorage {
  switch (config.STORAGE_PROVIDER) {
    case 'gcs':
      return new GcsStorage(config.UPLOAD_BUCKET);
  }
}
