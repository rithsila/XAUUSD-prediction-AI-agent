// Storage helpers using AWS S3
// Configure with AWS_S3_BUCKET and AWS_REGION (and optionally AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY)

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let _s3: S3Client | null = null;

function ensureS3(): S3Client {
  if (_s3) return _s3;

  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region) {
    throw new Error("AWS_REGION is not set. Configure AWS credentials and region to use S3 storage.");
  }

  _s3 = new S3Client({
    region,
    credentials:
      accessKeyId && secretAccessKey
        ? { accessKeyId, secretAccessKey }
        : undefined, // Use default credentials provider chain if not explicitly set
  });
  return _s3;
}

function getBucket(): string {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET is not set. Provide an S3 bucket name for storage.");
  }
  return bucket;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const s3 = ensureS3();
  const bucket = getBucket();
  const key = normalizeKey(relKey);

  const body: Buffer | Uint8Array | string =
    typeof data === "string" ? data : Buffer.from(data as Buffer | Uint8Array);

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  // Return a presigned download URL for convenience
  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 60 * 60 } // 1 hour
  );

  return { key, url };
}

export async function storageGet(
  relKey: string,
  expiresInSeconds = 300
): Promise<{ key: string; url: string }> {
  const s3 = ensureS3();
  const bucket = getBucket();
  const key = normalizeKey(relKey);

  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: expiresInSeconds }
  );

  return { key, url };
}
