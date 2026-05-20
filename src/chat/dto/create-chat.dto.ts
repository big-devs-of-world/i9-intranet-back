import { ArrayMinSize, IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateChatDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isDM?: boolean;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(2)
  participants: string[];
}
