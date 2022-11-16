import { IsNotEmpty, IsString } from 'class-validator';

export class MentorshipDto {
  @IsNotEmpty()
  @IsString()
  background: string;
  @IsNotEmpty()
  @IsString()
  expectations: string;
  @IsNotEmpty()
  @IsString()
  message: string;
}
