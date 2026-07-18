import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @MaxLength(12)
  code!: string;

  @IsString()
  userName!: string;

  @IsString()
  userShortName!: string;

  @IsString()
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
