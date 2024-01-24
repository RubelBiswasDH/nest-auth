export interface JwtPayload {
  sub: string;
  iat?: number;
  exp?: number;
  jti?: string;
  id?: string | number;
  tokenId?: string | number;
  email?: string;
}
