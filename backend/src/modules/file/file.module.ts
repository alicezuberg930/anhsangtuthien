import { Module } from '@nestjs/common'
import { FileService } from './file.service'
import { FileController } from './file.controller'
import { MulterModule } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 4 * 1024 * 1024,
      },
    }),
  ],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule { }
