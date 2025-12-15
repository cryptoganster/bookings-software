# 🚀 Quick Start - Database Setup

## Configuración Inicial

### 1. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password_aqui
DB_DATABASE=bookings_dev

# Application
NODE_ENV=development
PORT=3000

# JWT
JWT_SECRET=tu_secret_super_seguro_aqui
JWT_EXPIRATION=1d
```

### 2. Crear Base de Datos

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE bookings_dev;

# Salir
\q
```

### 3. Ejecutar Migraciones

```bash
# Compilar el proyecto
npm run build

# Ejecutar migraciones
npm run migration:run
```

**Salida esperada:**
```
✅ EnableUuidExtension1702550000000 has been executed successfully
✅ CreateAppointmentsTable1702551000000 has been executed successfully
✅ CreateCapacitiesTable1702551100000 has been executed successfully
✅ CreateUsersTable1702552000000 has been executed successfully
```

### 4. Ejecutar Seeder (Opcional)

```bash
npm run seed
```

**Salida esperada:**
```
✅ Database connection established
🧹 Cleaning existing data...
👤 Creating test user...
✅ User created: test@example.com / Test123!
💼 Creating test offerings...
✅ Offering IDs created: ...
📅 Creating capacities for next 30 days...
✅ Created 90 capacity records
📝 Creating sample appointments...
✅ Created 2 sample appointments
✅ Updated capacities to reflect appointments

📊 Seeding Summary:
==================
✅ 1 test user created
   Email: test@example.com
   Password: Test123!
✅ 3 offering IDs generated
✅ 90 capacity records created (30 days)
✅ 2 sample appointments created
==================

✅ Seeding completed successfully
```

## 🧪 Verificar Instalación

### Conectar a la Base de Datos

```bash
psql -U postgres -d bookings_dev
```

### Verificar Tablas

```sql
-- Listar todas las tablas
\dt

-- Debería mostrar:
-- appointments
-- capacities
-- users
-- migrations
```

### Verificar Datos del Seeder

```sql
-- Ver usuario de prueba
SELECT id, email, name FROM users;

-- Ver capacidades
SELECT offering_id, date, total_slots, available_slots 
FROM capacities 
LIMIT 10;

-- Ver citas
SELECT id, business_id, customer_id, date_time, status 
FROM appointments;
```

## 🔄 Comandos Útiles

### Migraciones

```bash
# Ver estado de migraciones
npm run migration:show

# Revertir última migración
npm run migration:revert

# Generar nueva migración
npm run migration:generate -- src/database/migrations/NombreMigracion
```

### Desarrollo

```bash
# Limpiar y recrear BD
npm run seed  # Limpia y crea datos de prueba

# Iniciar aplicación
npm run start:dev
```

### Testing

```bash
# Setup BD de test
npm run test:setup-db

# Ejecutar tests
npm test
```

## 🐛 Troubleshooting

### Error: "relation does not exist"

**Solución:** Ejecutar migraciones
```bash
npm run build
npm run migration:run
```

### Error: "password authentication failed"

**Solución:** Verificar credenciales en `.env`
```bash
# Verificar que DB_USERNAME y DB_PASSWORD sean correctos
cat .env | grep DB_
```

### Error: "database does not exist"

**Solución:** Crear la base de datos
```bash
psql -U postgres -c "CREATE DATABASE bookings_dev;"
```

### Error: "Cannot find module"

**Solución:** Compilar el proyecto
```bash
npm run build
```

### Limpiar y Empezar de Nuevo

```bash
# 1. Revertir todas las migraciones
npm run migration:revert
npm run migration:revert
npm run migration:revert
npm run migration:revert

# 2. Ejecutar migraciones de nuevo
npm run migration:run

# 3. Ejecutar seeder
npm run seed
```

## 📊 Estructura de Datos Creada

### Usuario de Prueba
- **Email:** test@example.com
- **Password:** Test123!
- Puedes usar estas credenciales para login en el panel web

### Capacidades
- 90 registros (3 offerings × 30 días)
- Offering 1: 8 slots/día
- Offering 2: 12 slots/día
- Offering 3: 4 slots/día

### Citas
- 2 citas de ejemplo para los próximos días
- Estado: CONFIRMED
- Las capacidades están actualizadas para reflejar estas citas

## 🎯 Próximos Pasos

1. **Iniciar la aplicación:**
   ```bash
   npm run start:dev
   ```

2. **Probar el login:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!"}'
   ```

3. **Ver citas:**
   ```bash
   curl http://localhost:3000/api/appointments \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

## 📚 Documentación Adicional

- Ver `MIGRATIONS_AND_SEEDS.md` para documentación detallada
- Ver `src/database/README.md` para información sobre la estructura
- Ver `.env.example` para todas las variables de entorno disponibles

## ✅ Checklist de Setup

- [ ] PostgreSQL instalado y corriendo
- [ ] Base de datos `bookings_dev` creada
- [ ] Archivo `.env` configurado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Proyecto compilado (`npm run build`)
- [ ] Migraciones ejecutadas (`npm run migration:run`)
- [ ] Seeder ejecutado (`npm run seed`)
- [ ] Aplicación iniciada (`npm run start:dev`)
- [ ] Login probado con usuario de prueba

¡Listo! Tu base de datos está configurada y lista para usar. 🎉
