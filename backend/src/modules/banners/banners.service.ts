import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { BannerData } from './dto/create-banner.dto'
import { UpdateBannerData } from './dto/update-banner.dto'
import { InjectModel } from '@nestjs/mongoose'
import { Banner, BannerDocument } from './shemas/banner.schema'
import { Model } from 'mongoose'
import { FileService } from '../file/file.service'
import { QueryBanner } from './dto/query-banner.dto'
import { ReorderBannersData } from './dto/reorder-banners.dto'

@Injectable()
export class BannersService {
  constructor(@InjectModel(Banner.name) private bannerModel: Model<BannerDocument>, private fileService: FileService) { }

  async create(bannerData: BannerData) {
    try {
      const lastBanner = await this.bannerModel.findOne().sort({ order: -1 }).select('order').lean()
      return await this.bannerModel.create({
        ...bannerData,
        order: (lastBanner?.order ?? 0) + 1,
      })
    } catch (error) {
      throw new BadRequestException(error)
    }
  }

  async findAll(query: QueryBanner) {
    try {
      const { page, isActive } = query
      let banners: Banner[] = []
      const filter: Partial<Record<string, any>> = {}
      if (isActive) {
        filter.isActive = isActive
      }
      banners = await this.bannerModel.find(filter).sort({ order: 1 })
      return banners
    } catch (error) {
      throw new BadRequestException(error)
    }
  }

  async findOne(id: string) {
    try {
      let banner = await this.bannerModel.findById(id)
      if (!banner) throw new NotFoundException('Không tìm thấy banner')
      return banner
    } catch (error) {
      throw new BadRequestException(error)
    }
  }

  async update(id: string, bannerData: UpdateBannerData) {
    try {
      const banner = await this.bannerModel.findOneAndUpdate({ _id: id }, { ...bannerData }, { new: true })
      if (!banner) throw new NotFoundException('Không tìm thấy banner')
      return banner
    } catch (error) {
      throw new BadRequestException(error)
    }
  }

  async reorder({ ids }: ReorderBannersData) {
    try {
      const banners = await this.bannerModel.find().select('_id').lean()
      const existingIds = new Set(banners.map((banner) => banner._id.toString()))

      if (ids.length !== existingIds.size || ids.some((id) => !existingIds.has(id))) {
        throw new BadRequestException('Danh sách banner không hợp lệ')
      }

      await this.bannerModel.bulkWrite(
        ids.map((id, index) => ({
          updateOne: {
            filter: { _id: id },
            update: { $set: { order: index + 1 } },
          },
        }))
      )

      return await this.bannerModel.find().sort({ order: 1 })
    } catch (error) {
      throw new BadRequestException(error)
    }
  }

  async remove(id: string) {
    try {
      const banner = await this.bannerModel.findOneAndDelete({ _id: id })
      if (!banner) throw new NotFoundException('Không tìm thấy banner')
      await this.bannerModel.updateMany(
        { order: { $gt: banner.order } },
        { $inc: { order: -1 } }
      )
      await this.fileService.delete([banner.image])
      return banner
    } catch (error) {
      throw new BadRequestException(error)
    }
  }
}
