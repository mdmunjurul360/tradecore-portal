import { BadRequestException } from '@nestjs/common';
import * as path from 'path';

export const kycFileFilter = (
  req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  const allowedExtensions = ['.pdf', '.jpeg', '.jpg', '.png'];

  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (!allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.includes(fileExt)) {
    return callback(
      new BadRequestException('Invalid file type. Only PDF, JPG, JPEG, and PNG are allowed.'),
      false,
    );
  }

  callback(null, true);
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
