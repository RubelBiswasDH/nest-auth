import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { EmailDataDto } from './dtos/email-data.dto';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendEmail({ to, subject, text, html, attachments }: EmailDataDto) {
    console.log({ to, subject, text, html, attachments });
    await this.mailerService
      .sendMail({
        to: to,
        subject: subject,
        text: text,
        html: html,
        attachments: attachments,
      })
      .then((res: any) => {
        console.log({ res });
      })
      .catch((err) => {
        console.log({ err });
      });
  }
}
