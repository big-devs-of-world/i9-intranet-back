import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { EUserRole } from '../../utils/enum/user.enum';

export class CreateUserDto {
  @ApiProperty({ description: 'Nome do usuário', example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao@i9mais.com.br',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Nível de permissão do usuário',
    enum: EUserRole,
    default: EUserRole.USER,
    example: EUserRole.USER,
    required: false,
  })
  @IsEnum(EUserRole)
  @IsOptional()
  role?: EUserRole;
}
