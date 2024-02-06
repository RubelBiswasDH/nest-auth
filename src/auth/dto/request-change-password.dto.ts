import { IsNotEmpty, Matches, MaxLength, MinLength } from 'class-validator';

export class RequestChangePasswordDTO {
  @MinLength(8, {
    message: 'password too short',
  })
  @MaxLength(20, {
    message: 'password too long',
  })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  @IsNotEmpty()
  readonly newPassword: string;

  @IsNotEmpty()
  readonly oldPassword: string;
}
