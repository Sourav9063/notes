import { Storage, type Bucket } from '@google-cloud/storage';
import type { ObjectStorage, UploadTarget } from './types.js';

export class GcsStorage implements ObjectStorage {
  private readonly bucket: Bucket;

  // new Storage() uses Application Default Credentials:
  // Workload Identity on GKE, `gcloud auth application-default login` on a laptop.
  constructor(bucketName: string, storage = new Storage()) {
    this.bucket = storage.bucket(bucketName);
  }

  async createUploadTarget(
    key: string,
    contentType: string,
    sizeBytes: number,
    expiresInSeconds: number,
  ): Promise<UploadTarget> {
    // Signed header: Cloud Storage rejects the PUT (400) if the body is larger than sizeBytes.
    const sizeLimit = { 'x-goog-content-length-range': `0,${sizeBytes}` };
    const [url] = await this.bucket.file(key).getSignedUrl({
      version: 'v4',
      action: 'write',
      contentType,
      extensionHeaders: sizeLimit,
      expires: Date.now() + expiresInSeconds * 1000,
    });
    return { url, headers: { 'Content-Type': contentType, ...sizeLimit } };
  }

  async createDownloadUrl(key: string, expiresInSeconds: number): Promise<string> {
    const [url] = await this.bucket.file(key).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresInSeconds * 1000,
    });
    return url;
  }
}
