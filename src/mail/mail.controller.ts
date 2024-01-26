import { Controller, HttpCode, HttpStatus } from '@nestjs/common';
import { Post, Body } from '@nestjs/common';
import { MailService } from './mail.service';
import { EmailDataDto } from './dtos/email-data.dto';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @HttpCode(HttpStatus.OK)
  @Post('send')
  async sendTestEmail(@Body() data: EmailDataDto) {
    this.mailService.sendEmail(data);
  }
}
