import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { BcryptService } from './bcrypt.service';
import { AuthController } from './auth.controller';
import { User } from '../user/entities/user.entity';
import jwtConfig from '../common/config/jwt.config';
import { JwtStrategy } from './strategies/jwt-strategy';
import { TokenService } from 'src/token/token.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  controllers: [AuthController],
  providers: [TokenService, AuthService, BcryptService, JwtStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
