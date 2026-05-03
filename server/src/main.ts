import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 5000;

  await app.listen(port, '0.0.0.0'); // 🔥 THIS IS THE FIX

  console.log(`🚀 Server running on port ${port}`);
}

bootstrap();