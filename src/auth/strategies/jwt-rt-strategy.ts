import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../../common/interfaces/jwt.payload.interface';
import { TokenService } from '../../token/token.service';
import jwtConfig from 'src/common/config/jwt.config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class JwtRTStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly tokenService: TokenService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromBodyField('refreshToken'),
      ]),
      secretOrKey: jwtConfiguration.secret,
      passReqToCallback: true,
    });
  }

  async validate(payload: JwtPayload) {
    const result = await this.tokenService.validatePayload(payload);
    if (!result) {
      throw new UnauthorizedException();
    }
    return result;
  }
}
