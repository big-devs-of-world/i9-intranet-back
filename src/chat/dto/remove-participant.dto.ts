import { IsString } from 'class-validator';

export class RemoveParticipantDto {
  @IsString()
  userId: string;
}
