import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RefreshToken } from './entities/refresh-token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { INVALID_TOKEN_MESSAGE } from 'src/common/constants';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async blacklistToken(refreshToken: string, userId: number): Promise<any> {
    const token = await this.refreshTokenRepository.findOne({
      where: {
        userId: Equal(userId),
        refreshToken: Equal(refreshToken),
      },
    });

    if (!token) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }

    Object.assign(token, { isBlackListed: 1 });

    return await this.refreshTokenRepository.save(token);
  }
}
