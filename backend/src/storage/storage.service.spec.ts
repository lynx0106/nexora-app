import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { BadRequestException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('StorageService', () => {
  let service: StorageService;
  let mockSupabaseClient: any;

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test image content'),
    size: 18,
    destination: '',
    filename: 'test.jpg',
    path: '',
    stream: null as any,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabaseClient = {
      storage: {
        from: jest.fn().mockReturnThis(),
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        remove: jest.fn(),
        createSignedUrl: jest.fn(),
        list: jest.fn(),
      },
    };

    // Reset environment
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_ANON_KEY;
  });

  describe('without Supabase credentials', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [StorageService],
      }).compile();

      service = module.get<StorageService>(StorageService);
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should return false when Supabase credentials are not set', () => {
      expect(service.isSupabaseAvailable()).toBe(false);
    });

    it('should throw error when uploading without Supabase', async () => {
      await expect(service.uploadFile('products', mockFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error when deleting without Supabase', async () => {
      await expect(service.deleteFile('products/test.jpg')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error when getting signed URL without Supabase', async () => {
      await expect(service.getSignedUrl('products/test.jpg')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error when listing files without Supabase', async () => {
      await expect(service.listFiles('products')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('with Supabase credentials', () => {
    beforeEach(async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

      (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);

      const module: TestingModule = await Test.createTestingModule({
        providers: [StorageService],
      }).compile();

      service = module.get<StorageService>(StorageService);
    });

    afterEach(() => {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should return true when Supabase is configured', () => {
      expect(service.isSupabaseAvailable()).toBe(true);
    });

    describe('uploadFile', () => {
      it('should upload file successfully', async () => {
        mockSupabaseClient.storage.upload.mockResolvedValue({
          data: { path: 'products/123-test.jpg' },
          error: null,
        });
        mockSupabaseClient.storage.getPublicUrl.mockReturnValue({
          data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/uploads/products/123-test.jpg' },
        });

        const result = await service.uploadFile('products', mockFile);

        expect(result.url).toContain('https://test.supabase.co');
        expect(result.path).toBe('products/123-test.jpg');
      });

      it('should throw error for invalid bucket', async () => {
        await expect(service.uploadFile('invalid' as any, mockFile)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should handle upload error', async () => {
        mockSupabaseClient.storage.upload.mockResolvedValue({
          data: null,
          error: { message: 'Upload failed' },
        });

        await expect(service.uploadFile('products', mockFile)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should use custom path when provided', async () => {
        mockSupabaseClient.storage.upload.mockResolvedValue({
          data: { path: 'products/custom-path.jpg' },
          error: null,
        });
        mockSupabaseClient.storage.getPublicUrl.mockReturnValue({
          data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/uploads/products/custom-path.jpg' },
        });

        const result = await service.uploadFile('products', mockFile, 'custom-path.jpg');

        expect(result.path).toBe('products/custom-path.jpg');
      });

      it('should upload to avatars bucket', async () => {
        mockSupabaseClient.storage.upload.mockResolvedValue({
          data: { path: 'avatars/avatar.jpg' },
          error: null,
        });
        mockSupabaseClient.storage.getPublicUrl.mockReturnValue({
          data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/uploads/avatars/avatar.jpg' },
        });

        const result = await service.uploadFile('avatars', mockFile);

        expect(result.path).toContain('avatars');
      });

      it('should upload to chat bucket', async () => {
        mockSupabaseClient.storage.upload.mockResolvedValue({
          data: { path: 'chat/message.jpg' },
          error: null,
        });
        mockSupabaseClient.storage.getPublicUrl.mockReturnValue({
          data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/uploads/chat/message.jpg' },
        });

        const result = await service.uploadFile('chat', mockFile);

        expect(result.path).toContain('chat');
      });

      it('should upload to tenants bucket', async () => {
        mockSupabaseClient.storage.upload.mockResolvedValue({
          data: { path: 'tenants/logo.jpg' },
          error: null,
        });
        mockSupabaseClient.storage.getPublicUrl.mockReturnValue({
          data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/uploads/tenants/logo.jpg' },
        });

        const result = await service.uploadFile('tenants', mockFile);

        expect(result.path).toContain('tenants');
      });
    });

    describe('deleteFile', () => {
      it('should delete file successfully', async () => {
        mockSupabaseClient.storage.remove.mockResolvedValue({
          error: null,
        });

        const result = await service.deleteFile('products/test.jpg');

        expect(result).toBe(true);
      });

      it('should return false on delete error', async () => {
        mockSupabaseClient.storage.remove.mockResolvedValue({
          error: { message: 'Delete failed' },
        });

        const result = await service.deleteFile('products/test.jpg');

        expect(result).toBe(false);
      });

      it('should return false on exception', async () => {
        mockSupabaseClient.storage.remove.mockRejectedValue(new Error('Network error'));

        const result = await service.deleteFile('products/test.jpg');

        expect(result).toBe(false);
      });
    });

    describe('getSignedUrl', () => {
      it('should generate signed URL successfully', async () => {
        mockSupabaseClient.storage.createSignedUrl.mockResolvedValue({
          data: { signedUrl: 'https://test.supabase.co/signed-url' },
          error: null,
        });

        const result = await service.getSignedUrl('products/test.jpg');

        expect(result).toBe('https://test.supabase.co/signed-url');
      });

      it('should use custom expiration time', async () => {
        mockSupabaseClient.storage.createSignedUrl.mockResolvedValue({
          data: { signedUrl: 'https://test.supabase.co/signed-url' },
          error: null,
        });

        await service.getSignedUrl('products/test.jpg', 7200);

        expect(mockSupabaseClient.storage.createSignedUrl).toHaveBeenCalledWith(
          'products/test.jpg',
          7200,
        );
      });

      it('should throw error on signed URL failure', async () => {
        mockSupabaseClient.storage.createSignedUrl.mockResolvedValue({
          data: null,
          error: { message: 'Failed to create signed URL' },
        });

        await expect(service.getSignedUrl('products/test.jpg')).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('listFiles', () => {
      it('should list files successfully', async () => {
        mockSupabaseClient.storage.list.mockResolvedValue({
          data: [
            { name: 'file1.jpg' },
            { name: 'file2.jpg' },
          ],
          error: null,
        });

        const result = await service.listFiles('products');

        expect(result).toHaveLength(2);
        expect(result[0]).toBe('products/file1.jpg');
        expect(result[1]).toBe('products/file2.jpg');
      });

      it('should use custom limit', async () => {
        mockSupabaseClient.storage.list.mockResolvedValue({
          data: [],
          error: null,
        });

        await service.listFiles('products', 50);

        expect(mockSupabaseClient.storage.list).toHaveBeenCalledWith('products', {
          limit: 50,
          sortBy: { column: 'created_at', order: 'desc' },
        });
      });

      it('should throw error on list failure', async () => {
        mockSupabaseClient.storage.list.mockResolvedValue({
          data: null,
          error: { message: 'Failed to list files' },
        });

        await expect(service.listFiles('products')).rejects.toThrow(
          BadRequestException,
        );
      });
    });
  });
});
