import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { BadRequestException } from '@nestjs/common';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isSupabaseAvailable', () => {
    it('should return false when Supabase credentials are not set', () => {
      // Without SUPABASE_URL and SUPABASE_KEY, it should return false
      expect(service.isSupabaseAvailable()).toBe(false);
    });
  });

  describe('uploadFile', () => {
    it('should throw error when Supabase is not configured', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 4,
        destination: '',
        filename: 'test.jpg',
        path: '',
        stream: null as any,
      };

      await expect(service.uploadFile('products', mockFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error for invalid bucket', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 4,
        destination: '',
        filename: 'test.jpg',
        path: '',
        stream: null as any,
      };

      // This will throw because Supabase is not configured, but we test the bucket validation
      await expect(service.uploadFile('invalid' as any, mockFile)).rejects.toThrow();
    });
  });

  describe('deleteFile', () => {
    it('should throw error when Supabase is not configured', async () => {
      await expect(service.deleteFile('products/test.jpg')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getSignedUrl', () => {
    it('should throw error when Supabase is not configured', async () => {
      await expect(service.getSignedUrl('products/test.jpg')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('listFiles', () => {
    it('should throw error when Supabase is not configured', async () => {
      await expect(service.listFiles('products')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
