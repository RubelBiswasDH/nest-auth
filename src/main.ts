import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new TransformInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) => {
        return new BadRequestException(
          errors.map((error: any) => ({
            [error.property]: Object.values(error.constraints).join(', '),
          })),
        );
      },
      transform: true,
      whitelist: true,
      stopAtFirstError: true,
      validateCustomDecorators: true,
    }),
  );
  await app.listen(3000);
}

bootstrap();
