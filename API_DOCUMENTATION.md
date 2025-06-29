# Documentación Técnica - Parking API

## Información General

- **Base URL**: `http://localhost:3000`
- **Versión**: 1.0.0
- **Formato de respuesta**: JSON
- **Autenticación**: JWT Bearer Token

## Autenticación

La API utiliza JWT (JSON Web Tokens) para la autenticación. Para acceder a endpoints protegidos, incluye el token en el header:

```
Authorization: Bearer <token>
```

## Endpoints

### Autenticación

#### POST /api/auth/register
Registra un nuevo usuario en el sistema.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

**Respuesta exitosa (201):**
```json
{
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "phone": "+1234567890",
      "role": "client"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /api/auth/login
Inicia sesión de un usuario.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Respuesta exitosa (200):**
```json
{
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "client"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /api/auth/refresh
Renueva un token JWT.

**Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Usuarios

#### GET /api/users
Obtiene todos los usuarios (solo admin).

**Headers:** `Authorization: Bearer <admin_token>`

**Respuesta exitosa (200):**
```json
{
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": 1,
      "email": "admin@parking.com",
      "name": "Admin User",
      "phone": "+1234567890",
      "role": "admin",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET /api/users/:id
Obtiene un usuario específico.

**Respuesta exitosa (200):**
```json
{
  "message": "User retrieved successfully",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "role": "client",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT /api/users/:id
Actualiza un usuario.

**Body:**
```json
{
  "name": "Updated Name",
  "phone": "+9876543210",
  "email": "updated@example.com"
}
```

**Respuesta exitosa (200):**
```json
{
  "message": "User updated successfully",
  "data": {
    "id": 1,
    "email": "updated@example.com",
    "name": "Updated Name",
    "phone": "+9876543210",
    "role": "client",
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
```

#### DELETE /api/users/:id
Elimina un usuario (solo admin).

**Respuesta exitosa (200):**
```json
{
  "message": "User deleted successfully",
  "data": {
    "id": 2,
    "email": "deleted@example.com",
    "name": "Deleted User"
  }
}
```

### Reservas

#### POST /api/reservations
Crea una nueva reserva de parking.

**Body:**
```json
{
  "parking_space_id": 1,
  "vehicle_plate": "ABC123",
  "vehicle_model": "Toyota Camry",
  "start_time": "2024-01-15T10:00:00Z",
  "end_time": "2024-01-15T12:00:00Z"
}
```

**Respuesta exitosa (201):**
```json
{
  "message": "Reservation created successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "parking_space_id": 1,
    "vehicle_plate": "ABC123",
    "vehicle_model": "Toyota Camry",
    "start_time": "2024-01-15T10:00:00Z",
    "end_time": "2024-01-15T12:00:00Z",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### GET /api/reservations
Obtiene las reservas del usuario.

**Respuesta exitosa (200):**
```json
{
  "message": "Reservations retrieved successfully",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "parking_space_id": 1,
      "vehicle_plate": "ABC123",
      "vehicle_model": "Toyota Camry",
      "start_time": "2024-01-15T10:00:00Z",
      "end_time": "2024-01-15T12:00:00Z",
      "status": "active",
      "space_number": "A01",
      "user_name": "John Doe",
      "email": "user@example.com"
    }
  ]
}
```

#### GET /api/reservations/:id
Obtiene una reserva específica.

#### PUT /api/reservations/:id
Actualiza una reserva.

**Body:**
```json
{
  "vehicle_plate": "XYZ789",
  "vehicle_model": "Honda Civic"
}
```

#### DELETE /api/reservations/:id
Cancela una reserva.

### Parking

#### GET /api/parking/spaces
Obtiene todos los espacios de parking.

**Respuesta exitosa (200):**
```json
{
  "message": "Parking spaces retrieved successfully",
  "data": [
    {
      "id": 1,
      "space_number": "A01",
      "is_available": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET /api/parking/occupancy
Obtiene la ocupación actual del parking.

**Respuesta exitosa (200):**
```json
{
  "message": "Parking occupancy retrieved successfully",
  "data": {
    "spaces": [
      {
        "space_id": 1,
        "space_number": "A01",
        "is_occupied": true,
        "current_reservation": {
          "id": 1,
          "vehicle_plate": "ABC123",
          "vehicle_model": "Toyota Camry",
          "start_time": "2024-01-15T10:00:00Z",
          "end_time": "2024-01-15T12:00:00Z",
          "user_name": "John Doe",
          "user_email": "user@example.com"
        }
      }
    ],
    "statistics": {
      "total_spaces": 20,
      "occupied_spaces": 5,
      "available_spaces": 15,
      "occupancy_rate": 25.0
    }
  }
}
```

#### POST /api/parking/spaces
Crea un nuevo espacio de parking (solo admin).

**Body:**
```json
{
  "space_number": "B01"
}
```

#### PUT /api/parking/spaces/:id
Actualiza un espacio de parking (solo admin).

**Body:**
```json
{
  "space_number": "A01-UPDATED",
  "is_available": false
}
```

#### DELETE /api/parking/spaces/:id
Elimina un espacio de parking (solo admin).

### Logs

#### GET /api/logs
Obtiene los logs del sistema (solo admin).

**Query Parameters:**
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 50)
- `action`: Filtrar por acción
- `user_id`: Filtrar por usuario
- `start_date`: Fecha de inicio
- `end_date`: Fecha de fin

**Respuesta exitosa (200):**
```json
{
  "message": "Logs retrieved successfully",
  "data": {
    "logs": [
      {
        "id": 1,
        "user_id": 1,
        "action": "POST /api/reservations",
        "details": {
          "method": "POST",
          "url": "/api/reservations",
          "status_code": 201
        },
        "ip_address": "127.0.0.1",
        "user_agent": "PostmanRuntime/7.32.3",
        "created_at": "2024-01-01T00:00:00Z",
        "user_name": "John Doe",
        "user_email": "user@example.com"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_logs": 250,
      "logs_per_page": 50
    }
  }
}
```

#### GET /api/logs/stats
Obtiene estadísticas de logs (solo admin).

**Respuesta exitosa (200):**
```json
{
  "message": "Log statistics retrieved successfully",
  "data": {
    "action_statistics": [
      {
        "action": "POST /api/reservations",
        "count": 45
      }
    ],
    "user_activity": [
      {
        "name": "John Doe",
        "email": "user@example.com",
        "activity_count": 25
      }
    ],
    "daily_activity": [
      {
        "date": "2024-01-01",
        "count": 15
      }
    ]
  }
}
```

#### GET /api/logs/:id
Obtiene un log específico (solo admin).

### Health Check

#### GET /health
Verifica el estado del servidor.

**Respuesta exitosa (200):**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00Z",
  "uptime": 3600
}
```

## Códigos de Error

### 400 Bad Request
```json
{
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "message": "Access token required"
}
```

### 403 Forbidden
```json
{
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 409 Conflict
```json
{
  "message": "Resource already exists"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

## Roles y Permisos

### Admin
- Acceso completo a todas las funcionalidades
- Gestión de usuarios (CRUD)
- Gestión de espacios de parking
- Acceso a logs del sistema
- Cambio de roles de usuarios

### Employee
- Consulta de ocupación del parking
- Gestión de reservas
- Acceso limitado a logs
- No puede gestionar usuarios ni espacios

### Client
- Crear/cancelar sus propias reservas
- Consultar sus reservas
- Actualizar su perfil
- Consultar ocupación del parking
- No puede acceder a logs ni gestionar otros usuarios

## Ejemplos de Uso

### Flujo típico de reserva

1. **Registrar usuario:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe",
    "phone": "+1234567890"
  }'
```

2. **Hacer login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

3. **Crear reserva:**
```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "parking_space_id": 1,
    "vehicle_plate": "ABC123",
    "vehicle_model": "Toyota Camry",
    "start_time": "2024-01-15T10:00:00Z",
    "end_time": "2024-01-15T12:00:00Z"
  }'
```

4. **Consultar ocupación:**
```bash
curl -X GET http://localhost:3000/api/parking/occupancy \
  -H "Authorization: Bearer <token>"
```

## Consideraciones de Seguridad

- Todas las contraseñas se hashean con bcrypt
- Los tokens JWT tienen expiración configurable
- Rate limiting implementado (100 requests por 15 minutos)
- Headers de seguridad con Helmet
- CORS configurado para desarrollo y producción
- Logs de auditoría para todas las acciones
- Validación de datos en todos los endpoints 