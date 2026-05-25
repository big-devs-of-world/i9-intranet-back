import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ListFilesQueryDto {
  @ApiPropertyOptional({ description: 'Número máximo de arquivos retornados' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageSize?: number;

  @ApiPropertyOptional({
    description: 'Token da próxima página retornado pela requisição anterior',
  })
  @IsString()
  @IsOptional()
  pageToken?: string;

  @ApiPropertyOptional({
    description: 'Filtro utilizando a Drive Search Query Language',
  })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({ description: 'Campos retornados pela API' })
  @IsString()
  @IsOptional()
  fields?: string;

  @ApiPropertyOptional({ description: 'Critério de ordenação dos resultados' })
  @IsString()
  @IsOptional()
  orderBy?: string;
}
