import { ArrayNotEmpty, ArrayUnique, IsArray, IsMongoId } from 'class-validator'

export class ReorderBannersData {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsMongoId({ each: true })
  ids: string[]
}
