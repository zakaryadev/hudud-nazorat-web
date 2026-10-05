import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from '@nestjs/passport';
import { maxUploadBytes } from '../common/config';

@UseGuards(AuthGuard('jwt'))
@Controller('files')
export class FilesController {
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: process.env.UPLOAD_DIR || './uploads',
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${unique}${extname(file.originalname) || '.jpg'}`);
        },
      }),
      limits: { fileSize: maxUploadBytes() }, // MAX_UPLOAD_MB (standart 10)
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Faqat rasm yuklash mumkin'), false);
        }
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Fayl yuborilmadi');
    const base = process.env.PUBLIC_BASE_URL || '';
    return { url: `${base}/uploads/${file.filename}`, filename: file.filename, size: file.size };
  }
}
