import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Param,
  BadRequestException,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from '@nestjs/passport';
import { StorageService, StorageBucket } from '../storage/storage.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { fileTypeFromFile } from 'file-type';
import { readFile, unlink } from 'fs/promises';

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // Documents
  'application/pdf',
  // Audio
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
];

// Allowed file extensions
const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.pdf',
  '.mp3',
  '.wav',
  '.webm',
  '.ogg',
];

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  private readonly logger = new Logger(UploadsController.name);

  constructor(private readonly storageService: StorageService) {}

  @Post(':type')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a file (image, PDF, or audio) - Max 5MB' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'The file to upload (max 5MB). Allowed: images, PDF, audio',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type, size, or upload type',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_FILE_SIZE, // 5MB limit
      },
      storage: diskStorage({
        destination: (req, file, cb) => {
          const type = req.params.type as string;
          const validTypes = ['avatars', 'products', 'chat', 'tenants'];
          if (!validTypes.includes(type)) {
            // @ts-ignore
            return cb(new BadRequestException('Invalid upload type'), null);
          }
          const fs = require('fs');
          const dir = `./uploads/${type}`;
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Check file extension
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          return cb(
            new BadRequestException(
              `File extension not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
            ),
            false,
          );
        }

        // Check MIME type (first line of defense)
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return cb(new BadRequestException('File type not allowed'), false);
        }

        cb(null, true);
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('type') type: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate file size (double-check)
    if (file.size > MAX_FILE_SIZE) {
      // Clean up the saved file
      try {
        await unlink(file.path);
      } catch {
        // Ignore cleanup errors
      }
      throw new BadRequestException(`File size exceeds maximum allowed (5MB)`);
    }

    // Validate type parameter
    const validTypes: StorageBucket[] = [
      'avatars',
      'products',
      'chat',
      'tenants',
    ];
    if (!validTypes.includes(type as StorageBucket)) {
      await unlink(file.path).catch(() => {});
      throw new BadRequestException(
        `Invalid upload type: ${type}. Valid types are: ${validTypes.join(', ')}`,
      );
    }

    // Validate file by magic bytes (content-based validation)
    try {
      const fileType = await fileTypeFromFile(file.path);

      if (!fileType) {
        await unlink(file.path).catch(() => {});
        throw new BadRequestException('Could not determine file type');
      }

      if (!ALLOWED_MIME_TYPES.includes(fileType.mime)) {
        await unlink(file.path).catch(() => {});
        throw new BadRequestException(
          `File content type not allowed: ${fileType.mime}`,
        );
      }

      // Verify that the extension matches the actual content
      const ext = extname(file.originalname).toLowerCase();
      const mimeToExt: Record<string, string[]> = {
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/gif': ['.gif'],
        'image/webp': ['.webp'],
        'application/pdf': ['.pdf'],
        'audio/mpeg': ['.mp3'],
        'audio/mp3': ['.mp3'],
        'audio/wav': ['.wav'],
        'audio/webm': ['.webm'],
        'audio/ogg': ['.ogg'],
      };

      const validExts = mimeToExt[fileType.mime] || [];
      if (!validExts.includes(ext)) {
        await unlink(file.path).catch(() => {});
        throw new BadRequestException(
          `File extension does not match content. Expected: ${validExts.join(' or ')}`,
        );
      }

      this.logger.log(
        `File validated: ${fileType.mime}, size: ${file.size} bytes`,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      await unlink(file.path).catch(() => {});
      throw new BadRequestException('File validation failed');
    }

    // Try Supabase Storage first
    if (this.storageService.isSupabaseAvailable()) {
      try {
        const result = await this.storageService.uploadFile(
          type as StorageBucket,
          file,
        );
        this.logger.log(`File uploaded to Supabase: ${result.url}`);

        // Clean up local file after successful upload
        await unlink(file.path).catch(() => {});

        return {
          url: result.url,
          path: result.path,
          storage: 'supabase',
        };
      } catch (error) {
        this.logger.warn(
          `Supabase upload failed, falling back to local: ${error.message}`,
        );
        // Fall through to local storage
      }
    }

    // Fallback to local storage
    const localUrl = `/uploads/${type}/${file.filename}`;
    this.logger.log(`File saved locally: ${localUrl}`);
    return {
      url: localUrl,
      path: `${type}/${file.filename}`,
      storage: 'local',
    };
  }
}
