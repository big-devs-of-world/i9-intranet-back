import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class SearchFileByNameQueryDto {
    @ApiProperty({ description: 'Nome do arquivo' })
    @IsString()
    name?: string;

    @ApiPropertyOptional({ description: 'Define se a busca será exata ou parcial' })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    exactMatch?: boolean;

    @ApiPropertyOptional({ description: 'Número máximo de arquivos retornados por página' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    pageSize?: number;

    @ApiPropertyOptional({ description: 'Token da próxima página retornado pela requisição anterior' })
    @IsString()
    @IsOptional()
    pageToken?: string;

    @ApiPropertyOptional({ description: 'Campos retornados pela API' })
    @IsString()
    @IsOptional()
    fields?: string;

    @ApiPropertyOptional({ description: 'Critério de ordenação do resultado' })
    @IsString()
    @IsOptional()
    orderBy?: string;
}