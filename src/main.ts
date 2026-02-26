import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import dayjs from './common/date/date.config';

async function bootstrap() {
  process.env.TZ = 'America/Bogota';
  const logger = new Logger('Bootstrap');
  logger.log('Starting application...');
  const app = await NestFactory.create(AppModule);
  // Setting up Helmet
  app.use(helmet());
  // Setting up CORS
  app.enableCors({ origin: '*' });
  // Global prefix for routes
  app.setGlobalPrefix('api');
  // Setting Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        exposeUnsetFields: false,
        enableImplicitConversion: false,
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
  logger.log(
    `Application is running on: ${await app.getUrl()} - ${dayjs.tz(new Date()).format()}`,
  );
}
bootstrap();
