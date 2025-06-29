# Parking API

API RESTful para sistema de parking con autenticación JWT y sistema de roles.

## Características

- 🔐 Autenticación JWT
- 👥 Sistema de roles (admin, employee, client)
- 🚗 Gestión de reservas de parking
- 📊 Consulta de ocupación
- 👤 Gestión de usuarios
- 📝 Sistema de logs
- 🧪 Tests e2e automatizados
- 📚 Documentación completa

## Casos de Uso

1. **Reservar plaza de aparcamiento** - POST `/api/reservations`
2. **Consultar ocupación del parking** - GET `/api/parking/occupancy`
3. **Actualizar detalles de usuario** - PUT `/api/users/:id`
4. **Acceder a logs del parking** - GET `/api/logs`

## Instalación

### Prerrequisitos

- Node.js (v16 o superior)
- PostgreSQL
- npm o yarn

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd parking-api
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp env.example .env
   # Editar .env con tus configuraciones
   ```

4. **Configurar base de datos**
   ```bash
   # Crear base de datos PostgreSQL
   createdb parking_db
   
   # Ejecutar migraciones
   npm run db:migrate
   
   # Poblar con datos de prueba
   npm run db:seed
   ```

5. **Iniciar la aplicación**
   ```bash
   # Desarrollo
   npm run dev
   
   # Producción
   npm start
   ```

## Estructura del Proyecto

```
src/
├── config/          # Configuraciones
├── controllers/     # Controladores
├── database/        # Migraciones y seeds
├── middleware/      # Middlewares personalizados
├── models/          # Modelos de datos
├── routes/          # Rutas de la API
├── services/        # Lógica de negocio
├── utils/           # Utilidades
└── server.js        # Punto de entrada
```

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login de usuario
- `POST /api/auth/refresh` - Renovar token

### Usuarios
- `GET /api/users` - Listar usuarios (admin)
- `GET /api/users/:id` - Obtener usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario (admin)

### Reservas
- `POST /api/reservations` - Crear reserva
- `GET /api/reservations` - Listar reservas
- `GET /api/reservations/:id` - Obtener reserva
- `PUT /api/reservations/:id` - Actualizar reserva
- `DELETE /api/reservations/:id` - Cancelar reserva

### Parking
- `GET /api/parking/spaces` - Listar espacios
- `GET /api/parking/occupancy` - Obtener ocupación
- `POST /api/parking/spaces` - Crear espacio (admin)

### Logs
- `GET /api/logs` - Obtener logs (admin)

## Roles y Permisos

### Admin
- Acceso completo a todas las funcionalidades
- Gestión de usuarios
- Acceso a logs
- Gestión de espacios de parking

### Employee
- Consulta de ocupación
- Gestión de reservas
- Acceso limitado a logs

### Client
- Crear/cancelar sus propias reservas
- Consultar sus reservas
- Actualizar su perfil

## Testing

```bash
# Tests unitarios
npm test

# Tests e2e
npm run test:e2e
```

## Base de Datos

### Modelo de Datos

- **users**: Información de usuarios
- **parking_spaces**: Espacios de parking
- **reservations**: Reservas de parking
- **logs**: Registro de actividades

### Migraciones

Las migraciones se ejecutan automáticamente al iniciar la aplicación.

## Logs

El sistema registra automáticamente:
- Creación/actualización de reservas
- Login/logout de usuarios
- Acciones administrativas
- Errores del sistema

## Seguridad

- Autenticación JWT
- Autorización basada en roles
- Rate limiting
- Validación de datos
- Headers de seguridad (Helmet)
- CORS configurado

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## Licencia

MIT License 