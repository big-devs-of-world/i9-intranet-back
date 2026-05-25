import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateChatDto {
  @ApiProperty({ description: 'Nome da sala de chat' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Se o chat é Direct Message (DM)' })
  @IsOptional()
  @IsBoolean()
  isDM?: boolean;

  @ApiProperty({ description: 'Lista de IDs dos participantes' })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(2)
  participants: string[];
}
