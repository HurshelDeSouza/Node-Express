# Guía de Pruebas - Parking API

## Configuración Inicial

1. **Importar colección en Postman:**
   - Abrir Postman
   - Click en "Import"
   - Seleccionar `Parking_API_Postman_Collection.json`
   - Click en "Import"

2. **Configurar URL base:**
   - Click en los tres puntos (...) de la colección "Parking API Collection"
   - Seleccionar "Edit"
   - Pestaña "Variables"
   - Cambiar `base_url` a: `http://localhost:5010`
   - Click en "Save"

## Secuencia de Pruebas

### 1. Health Check (Sin autenticación)
```
GET http://localhost:5010/api/health
```
**Respuesta esperada:**
```json
{
  "status": "OK",
  "message": "Parking API is running"
}
```

### 2. Login (Obtener token)
```
POST http://localhost:5010/api/auth/login
Content-Type: application/json

{
  "email": "admin@parking.com",
  "password": "admin123"
}
```
**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@parking.com",
      "name": "Admin User",
      "role": "admin"
    }
  }
}
```

### 3. Ver Espacios de Parking
```
GET http://localhost:5010/api/parking
Authorization: Bearer {{auth_token}}
```
**Respuesta esperada:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "space_number": "A1",
      "is_occupied": false,
      "hourly_rate": 5.00,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 4. Crear una Reserva
```
POST http://localhost:5010/api/reservations
Authorization: Bearer {{auth_token}}
Content-Type: application/json

{
  "parking_space_id": 1,
  "vehicle_plate": "ABC123",
  "vehicle_model": "Toyota Camry",
  "start_time": "2024-01-15T10:00:00Z",
  "end_time": "2024-01-15T12:00:00Z"
}
```

### 5. Ver Reservas
```
GET http://localhost:5010/api/reservations
Authorization: Bearer {{auth_token}}
```

### 6. Ver Usuarios (Solo Admin)
```
GET http://localhost:5010/api/users
Authorization: Bearer {{auth_token}}
```

## Credenciales de Prueba

### Admin
- Email: `admin@parking.com`
- Password: `admin123`

### Employee
- Email: `employee@parking.com`
- Password: `employee123`

### Client
- Email: `client@parking.com`
- Password: `client123`

## Notas Importantes

1. **El token se guarda automáticamente** cuando haces login
2. **Todos los endpoints protegidos** usan el token automáticamente
3. **Los roles determinan** qué endpoints puedes acceder:
   - Admin: Acceso completo
   - Employee: Gestión de parking y reservas
   - Client: Solo sus propias reservas

## Solución de Problemas

### Error 401 (Unauthorized)
- Verificar que el token esté presente
- Hacer login nuevamente

### Error 403 (Forbidden)
- Verificar que tu rol tenga permisos para el endpoint

### Error 500 (Server Error)
- Verificar que el servidor esté corriendo
- Revisar los logs del servidor 