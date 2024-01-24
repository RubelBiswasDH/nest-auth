import { Injectable } from '@nestjs/common';
import { JwtPayload } from 'src/common/interfaces/jwt.payload.interface';

@Injectable()
export class TokenService {
  async validatePayload(payload: JwtPayload): Promise<any> {
    return { id: payload.sub, email: payload.email, tokenId: payload.tokenId };
  }
}
