import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuración de CORS
  app.enableCors();
  
  // Configuración de validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Filtro global de excepciones
  app.useGlobalFilters(new HttpExceptionFilter());

  // Interceptor global para transformar respuestas
  app.useGlobalInterceptors(new TransformInterceptor());
  
  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Sistema de Inventario y Facturación API')
    .setDescription('API REST para gestión de inventario, ventas y facturación')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Aplicación corriendo en http://localhost:${port}`);
  console.log(`📚 Documentación Swagger en http://localhost:${port}/api/docs`);
}

bootstrap();
