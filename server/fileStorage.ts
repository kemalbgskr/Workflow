import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

const STORAGE_BUCKET = process.env.STORAGE_BUCKET;
const STORAGE_REGION = process.env.STORAGE_REGION || 'us-east-1';
const STORAGE_ENDPOINT = process.env.STORAGE_ENDPOINT;
const STORAGE_ACCESS_KEY = process.env.STORAGE_ACCESS_KEY;
const STORAGE_SECRET_KEY = process.env.STORAGE_SECRET_KEY;

let s3Client: S3Client | null = null;

if (STORAGE_ACCESS_KEY && STORAGE_SECRET_KEY && STORAGE_BUCKET) {
  s3Client = new S3Client({
    region: STORAGE_REGION,
    endpoint: STORAGE_ENDPOINT,
    credentials: {
      accessKeyId: STORAGE_ACCESS_KEY,
      secretAccessKey: STORAGE_SECRET_KEY
    }
  });
} else {
  console.warn('S3 storage not configured. File uploads will not work.');
}

export class FileStorageService {
  private generateKey(filename: string, prefix: string = 'documents'): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = filename.split('.').pop();
    return `${prefix}/${timestamp}-${randomString}.${ext}`;
  }

  async uploadFile(file: Buffer, filename: string, contentType: string = 'application/pdf'): Promise<string> {
    if (!s3Client || !STORAGE_BUCKET) {
      throw new Error('S3 storage not configured');
    }

    const key = this.generateKey(filename);

    const command = new PutObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: key,
      Body: file,
      ContentType: contentType
    });

    await s3Client.send(command);
    return key;
  }

  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!s3Client || !STORAGE_BUCKET) {
      throw new Error('S3 storage not configured');
    }

    const command = new GetObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: key
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  async deleteFile(key: string): Promise<void> {
    if (!s3Client || !STORAGE_BUCKET) {
      throw new Error('S3 storage not configured');
    }

    const command = new DeleteObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: key
    });

    await s3Client.send(command);
  }

  async getFileBuffer(key: string): Promise<Buffer> {
    if (!s3Client || !STORAGE_BUCKET) {
      throw new Error('S3 storage not configured');
    }

    const command = new GetObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: key
    });

    const response = await s3Client.send(command);
    const stream = response.Body as any;
    
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}

export const fileStorage = new FileStorageService();
