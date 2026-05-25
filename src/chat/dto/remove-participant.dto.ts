import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RemoveParticipantDto {
  @ApiProperty({ description: 'ID do usuário a ser removido' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
