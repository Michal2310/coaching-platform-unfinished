import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class MentorDto {
  @IsNotEmpty()
  @IsString()
  firstname: string;
  @IsNotEmpty()
  @IsString()
  lastname: string;
  @IsNotEmpty()
  @IsString()
  about: string;
  @IsNotEmpty()
  @IsString()
  title: string;
  @IsNotEmpty()
  @IsString()
  country: string;
  @IsArray()
  languages: string[];
  @IsArray()
  skills: string[];
}
