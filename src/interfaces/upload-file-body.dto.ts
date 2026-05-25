import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UploadFileBodyDto {
  @ApiPropertyOptional({ description: 'Nome do arquivo salvo' })
  @IsString()
  @IsOptional()
  fileName?: string;

  @ApiPropertyOptional({ description: 'ID da pasta de destino' })
  @IsString()
  @IsOptional()
  folderId?: string;

  @ApiPropertyOptional({ description: 'MIME type do arquivo' })
  @IsString()
  @IsOptional()
  mimeType?: string;
}
