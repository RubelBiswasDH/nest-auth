import { IsNotEmpty } from 'class-validator';

export class otpDTO {
  @IsNotEmpty()
  readonly otp: string;
}
