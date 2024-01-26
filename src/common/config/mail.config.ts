import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => {
  return {
    host: process.env.EMAIL_HOST || '',
    user: process.env.EMAIL_HOST_USER || '',
    password: process.env.EMAIL_HOST_PASSWORD || '',
  };
});
