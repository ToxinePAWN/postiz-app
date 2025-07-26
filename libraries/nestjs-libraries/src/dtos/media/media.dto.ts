import { IsDefined, IsString, IsUrl, ValidateIf, Validate } from 'class-validator';
import { ValidUrlPath } from '@gitroom/helpers/utils/valid.url.path';

export class MediaDto {
  @IsString()
  @IsDefined()
  id: string;

  @IsString()
  @IsDefined()
  @Validate(ValidUrlPath)
  path: string;

  @ValidateIf((o) => o.alt)
  @IsString()
  alt?: string;

  @ValidateIf((o) => o.thumbnail)
  @IsUrl()
  thumbnail?: string;

  @ValidateIf((o) => o.type)
  @IsString()
  type?: string;

  @ValidateIf((o) => o.thumbnailTimestamp)
  @IsString()
  thumbnailTimestamp?: string;
}
