import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsEnum, IsOptional } from 'class-validator';
import { EUserRole } from '../../utils/enum/user.enum';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Nome do usuário',
    example: 'João Silva',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao@i9mais.com.br',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Nível de permissão do usuário',
    enum: EUserRole,
    required: false,
  })
  @IsEnum(EUserRole)
  @IsOptional()
  role?: EUserRole;
}
