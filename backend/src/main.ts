import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/exceptions/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  
  // Setup Pino Logger
  const logger = app.get(Logger);
  app.useLogger(logger);

  // Global Prefix
  app.setGlobalPrefix('api/v1');

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter(logger));

  // Global Response Interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('TradeCore Backend API')
    .setDescription('The TradeCore Forex/CFD Brokerage Client Portal API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Start Server
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  logger.log(`TradeCore Backend is running on: http://localhost:${port}/api/v1`);
  logger.log(`Swagger Docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();
