import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtRTGuard } from './guards/jwt-rt-guard';
import { UseGuards } from '@nestjs/common';
import { RefreshTokenDTO } from 'src/token/dtos/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('sign-up')
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('sign-in')
  signIn(@Body() signInDto: SignInDto): Promise<{ accessToken: string }> {
    return this.authService.signIn(signInDto);
  }

  @UseGuards(JwtRTGuard)
  @Public()
  @Post('refresh-token')
  refreshToken(
    @Body() refreshTokenDto: RefreshTokenDTO,
  ): Promise<{ accessToken: string; refreshToken?: string }> {
    return this.authService.getAccessTokenFromRefreshToken(refreshTokenDto);
  }
}
