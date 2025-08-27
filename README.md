# Sistema de Inventario y Facturación - Backend

Backend desarrollado en NestJS para un sistema de inventario y facturación básico (MVP).

## 🚀 Características

- **Gestión de productos**: CRUD completo con control de stock y categorías
- **Sistema de ventas**: Registro de ventas con descuento automático de inventario
- **Generación de facturas**: Números de factura únicos y automáticos
- **Reportes**: Ventas diarias, mensuales e inventario
- **Autenticación**: JWT con roles (Administrador, Cajero)
- **Base de datos**: PostgreSQL con TypeORM
- **Validación**: DTOs con class-validator
- **Documentación**: Swagger UI en `/api/docs`

## 🛠️ Stack Tecnológico

- **Framework**: NestJS con TypeScript
- **Base de datos**: PostgreSQL
- **ORM**: TypeORM
- **Autenticación**: JWT + Passport
- **Validación**: class-validator + class-transformer
- **Documentación**: Swagger/OpenAPI
- **Testing**: Jest

## 📁 Estructura del Proyecto

```
src/
├── auth/                 # Autenticación y autorización
│   ├── dto/             # DTOs de autenticación
│   ├── strategies/      # Estrategias de Passport
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── users/               # Gestión de usuarios
│   ├── dto/            # DTOs de usuarios
│   ├── entities/        # Entidades de base de datos
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── products/            # Gestión de productos
│   ├── dto/            # DTOs de productos
│   ├── entities/        # Entidades de productos
│   ├── products.controller.ts
│   ├── products.service.ts
│   └── products.module.ts
├── sales/               # Gestión de ventas
│   ├── dto/            # DTOs de ventas
│   ├── entities/        # Entidades de ventas
│   ├── sales.controller.ts
│   ├── sales.service.ts
│   └── sales.module.ts
├── reports/             # Generación de reportes
│   ├── reports.controller.ts
│   ├── reports.service.ts
│   └── reports.module.ts
├── common/              # Utilidades comunes
│   ├── decorators/      # Decoradores personalizados
│   ├── guards/          # Guards de autenticación y autorización
│   └── interceptors/    # Interceptores
├── app.module.ts        # Módulo principal
└── main.ts             # Punto de entrada
```

## 🚀 Instalación

### Prerrequisitos

- Node.js (v16 o superior)
- PostgreSQL
- pnpm (recomendado) o npm

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd inventory-backend
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar variables de entorno

Copiar el archivo `.env.example` a `.env` y configurar:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_DATABASE=inventory_db

# JWT
JWT_SECRET=tu_super_secreto_jwt_aqui
JWT_EXPIRES_IN=24h

# App
PORT=3000
NODE_ENV=development
```

### 4. Crear base de datos

```sql
CREATE DATABASE inventory_db;
```

### 5. Ejecutar migraciones (TypeORM)

```bash
pnpm run typeorm migration:run
```

### 6. Ejecutar el proyecto

```bash
# Desarrollo
pnpm run start:dev

# Producción
pnpm run build
pnpm run start:prod
```

## 📚 API Endpoints

### Autenticación
- `POST /auth/register` - Registrar nuevo usuario
- `POST /auth/login` - Iniciar sesión

### Usuarios (Solo Admin)
- `GET /users` - Listar usuarios
- `GET /users/:id` - Obtener usuario
- `POST /users` - Crear usuario
- `PATCH /users/:id` - Actualizar usuario
- `DELETE /users/:id` - Eliminar usuario

### Productos
- `GET /products` - Listar productos
- `GET /products/:id` - Obtener producto
- `POST /products` - Crear producto (Admin)
- `PATCH /products/:id` - Actualizar producto (Admin)
- `DELETE /products/:id` - Eliminar producto (Admin)

### Ventas
- `POST /sales` - Crear venta
- `GET /sales` - Listar ventas
- `GET /sales/:id` - Obtener venta
- `GET /sales/my-sales` - Mis ventas
- `GET /sales/by-date-range` - Ventas por fecha

### Reportes
- `GET /reports/daily` - Reporte diario
- `GET /reports/monthly` - Reporte mensual
- `GET /reports/inventory` - Reporte de inventario (Admin)

## 🔐 Autenticación

El sistema utiliza JWT para autenticación. Incluye el token en el header:

```
Authorization: Bearer <tu_token_jwt>
```

### Roles

- **ADMIN**: Acceso completo a todas las funcionalidades
- **CASHIER**: Puede crear ventas y ver reportes básicos

## 📊 Base de Datos

### Entidades Principales

- **User**: Usuarios del sistema con roles
- **Product**: Productos con stock y categorías
- **Sale**: Ventas con items y totales
- **SaleItem**: Items individuales de cada venta

### Relaciones

- Un usuario puede tener múltiples ventas
- Una venta puede tener múltiples items
- Cada item está relacionado con un producto

## 🧪 Testing

```bash
# Ejecutar tests
pnpm run test

# Tests en modo watch
pnpm run test:watch

# Cobertura de tests
pnpm run test:cov
```

## 📝 Scripts Disponibles

- `pnpm run start:dev` - Desarrollo con hot reload
- `pnpm run build` - Compilar para producción
- `pnpm run start:prod` - Ejecutar en producción
- `pnpm run test` - Ejecutar tests
- `pnpm run lint` - Linting del código

## 🌐 Documentación API

Una vez ejecutando el proyecto, accede a la documentación Swagger en:

```
http://localhost:3000/api/docs
```

## 🔧 Configuración de Desarrollo

### TypeScript

El proyecto está configurado con TypeScript estricto y decoradores habilitados.

### ESLint + Prettier

Configurado para mantener consistencia en el código.

### Base de Datos

- **Desarrollo**: `synchronize: true` (auto-crear tablas)
- **Producción**: `synchronize: false` (usar migraciones)

## 🚀 Despliegue

### Variables de Entorno de Producción

```env
NODE_ENV=production
DB_HOST=tu_host_produccion
DB_PASSWORD=tu_password_produccion
JWT_SECRET=secreto_muy_seguro_produccion
```

### Comandos de Despliegue

```bash
pnpm run build
pnpm run start:prod
```

## 📞 Soporte

Para dudas o problemas, revisa:
1. Los logs del servidor
2. La documentación de Swagger
3. Los tests para entender el comportamiento esperado

## 📄 Licencia

Este proyecto es para uso educativo y de desarrollo.
