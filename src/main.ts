import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('I9+ API')
    .setDescription('Api utilizada para integração da intranet da I9 mais baterias')
    .setVersion('1.0')
    .addTag('I9')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  const PORT = process.env.PORT ?? 3000

  await app.listen(PORT);

  console.log(`App is running in http://localhost:${PORT} 🚀`);
  console.log(`Documentation is running in http://localhost:${PORT}/docs 📃`);
}
bootstrap();
