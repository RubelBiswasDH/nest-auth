import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRTGuard extends AuthGuard('jwt-refresh') {
  constructor() {
    super();
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
