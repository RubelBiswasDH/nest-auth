import { IsEmail, IsNotEmpty } from 'class-validator';

export class SignInDto {
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @IsNotEmpty()
  readonly password: string;
}
