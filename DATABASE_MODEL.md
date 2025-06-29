# Modelo de Datos - Parking API

## Descripción General

El sistema de parking utiliza PostgreSQL como base de datos principal y está compuesto por 4 tablas principales que gestionan usuarios, espacios de parking, reservas y logs del sistema.

## Diagrama ER

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    users    │    │ parking_spaces  │    │  reservations   │
├─────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)     │    │ id (PK)         │    │ id (PK)         │
│ email       │    │ space_number    │    │ user_id (FK)    │
│ password    │    │ is_available    │    │ vehicle_plate   │
│ name        │    │ created_at      │    │ vehicle_model   │
│ phone       │    │ updated_at      │    │ vehicle_model   │
│ role        │    └─────────────────┘    │ start_time      │
│ created_at  │                           │ end_time        │
│ updated_at  │                           │ status          │
└─────────────┘                           │ created_at      │
                                          │ updated_at      │
                                          └─────────────────┘
                                                  │
                                                  │
                                          ┌─────────────────┐
                                          │      logs       │
                                          ├─────────────────┤
                                          │ id (PK)         │
                                          │ user_id (FK)    │
                                          │ action          │
                                          │ details         │
                                          │ ip_address      │
                                          │ user_agent      │
                                          │ created_at      │
                                          └─────────────────┘
```

## Tablas

### 1. users

Almacena la información de todos los usuarios del sistema.

| Campo      | Tipo         | Restricciones                    | Descripción                    |
|------------|--------------|----------------------------------|--------------------------------|
| id         | SERIAL       | PRIMARY KEY                     | Identificador único del usuario |
| email      | VARCHAR(255) | UNIQUE, NOT NULL                | Email del usuario              |
| password   | VARCHAR(255) | NOT NULL                        | Contraseña hasheada            |
| name       | VARCHAR(255) | NOT NULL                        | Nombre completo del usuario    |
| phone      | VARCHAR(20)  | NULL                            | Número de teléfono             |
| role       | VARCHAR(20)  | DEFAULT 'client', CHECK         | Rol del usuario                |
| created_at | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP       | Fecha de creación              |
| updated_at | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP       | Fecha de última actualización  |

**Roles disponibles:**
- `admin`: Administrador con acceso completo
- `employee`: Empleado con acceso limitado
- `client`: Cliente con acceso básico

### 2. parking_spaces

Gestiona los espacios de parking disponibles.

| Campo         | Tipo         | Restricciones                    | Descripción                    |
|---------------|--------------|----------------------------------|--------------------------------|
| id            | SERIAL       | PRIMARY KEY                     | Identificador único del espacio |
| space_number  | VARCHAR(10)  | UNIQUE, NOT NULL                | Número del espacio de parking  |
| is_available  | BOOLEAN      | DEFAULT true                    | Estado de disponibilidad       |
| created_at    | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP       | Fecha de creación              |
| updated_at    | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP       | Fecha de última actualización  |

### 3. reservations

Registra todas las reservas de parking realizadas.

| Campo            | Tipo         | Restricciones                    | Descripción                    |
|------------------|--------------|----------------------------------|--------------------------------|
| id               | SERIAL       | PRIMARY KEY                     | Identificador único de la reserva |
| user_id          | INTEGER      | FOREIGN KEY, NOT NULL           | ID del usuario que reserva     |
| parking_space_id | INTEGER      | FOREIGN KEY, NOT NULL           | ID del espacio reservado       |
| vehicle_plate    | VARCHAR(20)  | NOT NULL                        | Matrícula del vehículo         |
| vehicle_model    | VARCHAR(100) | NULL                            | Modelo del vehículo            |
| start_time       | TIMESTAMP    | NOT NULL                        | Hora de inicio de la reserva   |
| end_time         | TIMESTAMP    | NOT NULL                        | Hora de fin de la reserva      |
| status           | VARCHAR(20)  | DEFAULT 'active', CHECK         | Estado de la reserva           |
| created_at       | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP       | Fecha de creación              |
| updated_at       | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP       | Fecha de última actualización  |

**Estados disponibles:**
- `active`: Reserva activa
- `cancelled`: Reserva cancelada
- `completed`: Reserva completada

### 4. logs

Registra todas las actividades del sistema para auditoría.

| Campo       | Tipo         | Restricciones                    | Descripción                    |
|-------------|--------------|----------------------------------|--------------------------------|
| id          | SERIAL       | PRIMARY KEY                     | Identificador único del log    |
| user_id     | INTEGER      | FOREIGN KEY, NULL               | ID del usuario que realizó la acción |
| action      | VARCHAR(100) | NOT NULL                        | Descripción de la acción       |
| details     | JSONB        | NULL                            | Detalles adicionales en JSON   |
| ip_address  | INET         | NULL                            | Dirección IP del usuario       |
| user_agent  | TEXT         | NULL                            | User agent del navegador       |
| created_at  | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP       | Fecha y hora del log           |

## Índices

Para optimizar el rendimiento de las consultas, se han creado los siguientes índices:

```sql
-- Índices para reservations
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_parking_space_id ON reservations(parking_space_id);
CREATE INDEX idx_reservations_start_time ON reservations(start_time);
CREATE INDEX idx_reservations_end_time ON reservations(end_time);

-- Índices para logs
CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_created_at ON logs(created_at);
```

## Relaciones

### Claves Foráneas

1. **reservations.user_id** → **users.id**
   - Relación: Muchas reservas pueden pertenecer a un usuario
   - Acción: CASCADE (si se elimina un usuario, se eliminan sus reservas)

2. **reservations.parking_space_id** → **parking_spaces.id**
   - Relación: Muchas reservas pueden usar un espacio de parking
   - Acción: CASCADE (si se elimina un espacio, se eliminan sus reservas)

3. **logs.user_id** → **users.id**
   - Relación: Muchos logs pueden pertenecer a un usuario
   - Acción: SET NULL (si se elimina un usuario, los logs mantienen la referencia pero con NULL)

## Restricciones de Integridad

### CHECK Constraints

1. **users.role**: Solo permite valores 'admin', 'employee', 'client'
2. **reservations.status**: Solo permite valores 'active', 'cancelled', 'completed'

### UNIQUE Constraints

1. **users.email**: Cada email debe ser único
2. **parking_spaces.space_number**: Cada número de espacio debe ser único

### NOT NULL Constraints

- **users**: email, password, name
- **parking_spaces**: space_number
- **reservations**: user_id, parking_space_id, vehicle_plate, start_time, end_time
- **logs**: action

## Consideraciones de Diseño

### Seguridad
- Las contraseñas se almacenan hasheadas con bcrypt
- Los logs no almacenan información sensible (contraseñas, tokens)
- Se registra la IP y user agent para auditoría

### Escalabilidad
- Uso de índices para optimizar consultas frecuentes
- Campos de timestamp para auditoría
- JSONB para detalles flexibles en logs

### Mantenibilidad
- Nombres de campos descriptivos
- Documentación clara de restricciones
- Separación de responsabilidades por tabla

## Ejemplos de Consultas Comunes

### Obtener ocupación actual del parking
```sql
SELECT 
  ps.id,
  ps.space_number,
  ps.is_available,
  r.id as reservation_id,
  r.vehicle_plate,
  r.vehicle_model,
  r.start_time,
  r.end_time,
  u.name as user_name
FROM parking_spaces ps
LEFT JOIN reservations r ON ps.id = r.parking_space_id 
  AND r.status = 'active' 
  AND NOW() BETWEEN r.start_time AND r.end_time
LEFT JOIN users u ON r.user_id = u.id
ORDER BY ps.space_number;
```

### Obtener reservas de un usuario
```sql
SELECT r.*, ps.space_number, u.name as user_name
FROM reservations r
JOIN parking_spaces ps ON r.parking_space_id = ps.id
JOIN users u ON r.user_id = u.id
WHERE r.user_id = $1
ORDER BY r.created_at DESC;
```

### Obtener logs de actividad
```sql
SELECT l.*, u.name as user_name, u.email as user_email
FROM logs l
LEFT JOIN users u ON l.user_id = u.id
ORDER BY l.created_at DESC
LIMIT 50;
``` 