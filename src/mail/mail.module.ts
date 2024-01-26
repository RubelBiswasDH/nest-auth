import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('mail.host'),
          secure: false,
          auth: {
            user: configService.get<string>('mail.user'),
            pass: configService.get<string>('mail.password'),
          },
        },
        defaults: {
          from: `No Reply <${configService.get<string>('mail.user')}>`,
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
  controllers: [MailController],
})
export class MailModule {}
