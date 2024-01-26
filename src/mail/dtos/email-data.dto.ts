import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
export class EmailDataDto {
  @IsEmail()
  @IsNotEmpty()
  readonly to: string;

  @IsNotEmpty()
  readonly subject: string;

  @IsOptional()
  readonly text: string;

  @IsOptional()
  readonly html: string;

  @IsOptional()
  readonly attachments: any[];
}
