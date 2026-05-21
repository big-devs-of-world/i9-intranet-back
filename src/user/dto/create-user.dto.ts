import { ApiProperty } from '@nestjs/swagger';
import { EUserRole } from '../../utils/enum/user.enum';

export class CreateUserDto {
  @ApiProperty({
    description: 'Nome do usuário',
  })
  name: string;

  @ApiProperty({
    description: 'Email do usuário',
  })
  email: string;

  @ApiProperty({
    description: 'Nivel de permição do usuário',
    enum: EUserRole,
    default: 'user'
  })
  role: EUserRole;
}