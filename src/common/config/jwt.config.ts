import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  return {
    secret: process.env.JWT_SECRET,
    accessTokenTtl: process.env.JWT_ACCESS_TOKEN_TTL,
    refreshTokenTtlValue: process.env.JWT_REFRESH_TOKEN_TTL_VALUE,
    refreshTokenTtlUnit: process.env.JWT_REFRESH_TOKEN_TTL_UNIT,
    refreshTokenTtl: `${process.env.JWT_REFRESH_TOKEN_TTL_VALUE}${process.env.JWT_REFRESH_TOKEN_TTL_UNIT}`,
  };
});
