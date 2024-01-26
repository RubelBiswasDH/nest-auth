import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import databaseConfig from './common/config/database.config';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { TokenService } from './token/token.service';
import jwtConfig from './common/config/jwt.config';
import mailConfig from './common/config/mail.config';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { TokenModule } from './token/token.module';
import { MailModule } from './mail/mail.module';
import { MailService } from './mail/mail.service';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [mailConfig, jwtConfig, databaseConfig],
    }),
    DatabaseModule,
    TokenModule,
    UserModule,
    AuthModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TokenService,
    MailService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
