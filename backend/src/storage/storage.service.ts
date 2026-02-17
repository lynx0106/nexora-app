import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type StorageBucket = 'products' | 'avatars' | 'chat' | 'tenants';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private supabase: SupabaseClient | null = null;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.logger.log('Supabase Storage client initialized');
    } else {
      this.logger.warn(
        'Supabase credentials not found. Storage will fall back to local filesystem.',
      );
    }
  }

  /**
   * Check if Supabase Storage is available
   */
  isSupabaseAvailable(): boolean {
    return this.supabase !== null;
  }

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    bucket: StorageBucket,
    file: Express.Multer.File,
    path?: string,
  ): Promise<{ url: string; path: string }> {
    if (!this.supabase) {
      throw new BadRequestException('Supabase Storage is not configured');
    }

    // Validate bucket
    const validBuckets: StorageBucket[] = ['products', 'avatars', 'chat', 'tenants'];
    if (!validBuckets.includes(bucket)) {
      throw new BadRequestException(`Invalid bucket: ${bucket}. Valid buckets are: ${validBuckets.join(', ')}`);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.originalname.split('.').pop() || 'bin';
    const fileName = path || `${timestamp}-${randomString}.${extension}`;

    // Full path in bucket
    const fullPath = `${bucket}/${fileName}`;

    try {
      const { data, error } = await this.supabase.storage
        .from('uploads')
        .upload(fullPath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        this.logger.error(`Upload error: ${error.message}`);
        throw new BadRequestException(`Failed to upload file: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('uploads')
        .getPublicUrl(data.path);

      return {
        url: urlData.publicUrl,
        path: data.path,
      };
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a file from Supabase Storage
   */
  async deleteFile(path: string): Promise<boolean> {
    if (!this.supabase) {
      throw new BadRequestException('Supabase Storage is not configured');
    }

    try {
      const { error } = await this.supabase.storage
        .from('uploads')
        .remove([path]);

      if (error) {
        this.logger.error(`Delete error: ${error.message}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Delete failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get a signed URL for private files (if needed)
   */
  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    if (!this.supabase) {
      throw new BadRequestException('Supabase Storage is not configured');
    }

    const { data, error } = await this.supabase.storage
      .from('uploads')
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new BadRequestException(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * List files in a bucket
   */
  async listFiles(bucket: StorageBucket, limit: number = 100): Promise<string[]> {
    if (!this.supabase) {
      throw new BadRequestException('Supabase Storage is not configured');
    }

    const { data, error } = await this.supabase.storage
      .from('uploads')
      .list(bucket, {
        limit,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      throw new BadRequestException(`Failed to list files: ${error.message}`);
    }

    return data.map((file) => `${bucket}/${file.name}`);
  }
}
