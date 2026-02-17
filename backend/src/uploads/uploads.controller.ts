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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  private readonly logger = new Logger(UploadsController.name);

  constructor(private readonly storageService: StorageService) {}

  @Post(':type')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a file (image, PDF, or audio)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The file to upload',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or upload type' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(
    FileInterceptor('file', {
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
        // Allow images, PDFs, and audio files
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|pdf|mpeg|mp3|wav|webm|ogg|webp)$/)) {
          return cb(
            new BadRequestException('Only image, PDF, or audio files are allowed!'),
            false,
          );
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

    // Validate type
    const validTypes: StorageBucket[] = ['avatars', 'products', 'chat', 'tenants'];
    if (!validTypes.includes(type as StorageBucket)) {
      throw new BadRequestException(`Invalid upload type: ${type}. Valid types are: ${validTypes.join(', ')}`);
    }

    // Try Supabase Storage first
    if (this.storageService.isSupabaseAvailable()) {
      try {
        const result = await this.storageService.uploadFile(
          type as StorageBucket,
          file,
        );
        this.logger.log(`File uploaded to Supabase: ${result.url}`);
        return {
          url: result.url,
          path: result.path,
          storage: 'supabase',
        };
      } catch (error) {
        this.logger.warn(`Supabase upload failed, falling back to local: ${error.message}`);
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
