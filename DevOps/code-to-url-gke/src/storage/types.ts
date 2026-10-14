export interface UploadTarget {
  url: string;
  // Headers the client must send with the PUT request; providers differ.
  headers: Record<string, string>;
}

export interface ObjectStorage {
  // Short-lived URL the client uses to PUT the file directly to the bucket.
  // Providers that support it reject bodies larger than sizeBytes.
  createUploadTarget(key: string, contentType: string, sizeBytes: number, expiresInSeconds: number): Promise<UploadTarget>;
  // Short-lived URL to GET a private object directly from the bucket.
  createDownloadUrl(key: string, expiresInSeconds: number): Promise<string>;
}
