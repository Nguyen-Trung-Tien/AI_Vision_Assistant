import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Increase payload limits to allow base64 images in feedback
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));
  app.use(cookieParser());
  app.enableCors({
    origin: ['http://127.0.0.1:4200', 'http://localhost:4200'],
    credentials: true,
  });
  app.setGlobalPrefix('api', {
    exclude: ['/'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable RabbitMQ Microservice Listener
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@127.0.0.1:5672/'],
      queue: 'ai_results_queue',
      queueOptions: {
        durable: true,
      },
      prefetchCount: 1,
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap().catch((err) => {
  console.error('Error during bootstrap', err);
  process.exit(1);
});
