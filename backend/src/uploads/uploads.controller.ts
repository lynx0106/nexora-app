import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Param,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from '@nestjs/passport';

@Controller('uploads')
export class UploadsController {
  @Post(':type')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const type = req.params.type as string;
          const validTypes = ['avatars', 'products', 'chat'];
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
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|pdf|mpeg|mp3|wav|webm|ogg)$/)) {
          return cb(
            new BadRequestException('Only image, PDF, or audio files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('type') type: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return {
      url: `/uploads/${type}/${file.filename}`,
    };
  }
}
