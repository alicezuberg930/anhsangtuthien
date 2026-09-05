import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { v2 as cloudinary } from 'cloudinary'
import { UploadApiResponse } from 'cloudinary'

@Injectable()
export class FileService {
  constructor(private readonly configService: ConfigService) {}

  private configureCloudinary() {
    const config = {
      cloudName: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      apiKey: this.configService.get<string>('CLOUDINARY_API_KEY'),
      apiSecret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    }
    const missingVariables = [
      !config.cloudName && 'CLOUDINARY_CLOUD_NAME',
      !config.apiKey && 'CLOUDINARY_API_KEY',
      !config.apiSecret && 'CLOUDINARY_API_SECRET',
    ].filter(Boolean)

    if (missingVariables.length > 0) {
      throw new ServiceUnavailableException(
        `File storage is not configured: missing ${missingVariables.join(', ')}`,
      )
    }

    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
    })
  }

  private uploadBuffer(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'webtinhthuong', resource_type: 'image' },
        (error, result) => {
          if (error) {
            reject(error)
            return
          }

          if (!result) {
            reject(new Error('Cloudinary returned no upload result'))
            return
          }

          resolve(result)
        },
      )

      stream.end(file.buffer)
    })
  }

  async upload(files: Array<Express.Multer.File>) {
    if (!files?.length) {
      throw new BadRequestException('No files were provided')
    }

    try {
      this.configureCloudinary()
      const responses = await Promise.all(
        files.map((file) => this.uploadBuffer(file)),
      )

      return responses.map((response) => response.secure_url)
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error
      }

      throw new BadRequestException(error)
    }

    // console.log(uploadResult)
    // Optimize delivery by resizing and applying auto-format and auto-quality
    // const optimizeUrl = cloudinary.url('shoes', {
    //   fetch_format: 'auto',
    //   quality: 'auto'
    // })
    // console.log(optimizeUrl)
    // Transform the image: auto-crop to square aspect_ratio
    // const autoCropUrl = cloudinary.url('shoes', {
    //   crop: 'auto',
    //   gravity: 'auto',
    //   width: 500,
    //   height: 500,
    // })
    // console.log(autoCropUrl)
  }

  async delete(fileUrls: string[]) {
    try {
      this.configureCloudinary()
      // Extract the public ID from the URL
      for (let i = 0; i < fileUrls.length; i++) {
        const publicId = fileUrls[i].split('/').slice(-2).join('/').replace(/\.[^/.]+$/, '')
        const response = await cloudinary.uploader.destroy(publicId)
        if (response.result !== 'ok') {
          throw new BadRequestException('Xóa file thất bại')
        }
      }
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error
      }

      throw new BadRequestException(error)
    }
  }
}
