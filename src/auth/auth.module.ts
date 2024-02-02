import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MailService } from 'src/mail/mail.service';
import { TokenService } from 'src/token/token.service';
import jwtConfig from '../common/config/jwt.config';
import { RefreshToken } from '../token/entities/refresh-token.entity';
import { ResetPasswordToken } from '../token/entities/reset-password-token.entity';
import { User } from '../user/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BcryptService } from './bcrypt.service';
import { JwtRTStrategy } from './strategies/jwt-rt-strategy';
import { JwtStrategy } from './strategies/jwt-strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, ResetPasswordToken]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  controllers: [AuthController],
  providers: [
    TokenService,
    AuthService,
    BcryptService,
    JwtStrategy,
    JwtRTStrategy,
    MailService,
  ],
  exports: [JwtModule],
})
export class AuthModule {}
