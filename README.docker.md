# Docker Setup para Desarrollo

## Base de Datos PostgreSQL

Este proyecto utiliza PostgreSQL como base de datos. Para desarrollo local, puedes usar Docker Compose.

### Requisitos

- Docker
- Docker Compose

### Levantar la Base de Datos

```bash
# Iniciar el contenedor de PostgreSQL
docker-compose -f docker-compose.dev.yml up -d

# Verificar que el contenedor está corriendo
docker ps

# Ver logs del contenedor
docker-compose -f docker-compose.dev.yml logs -f postgres
```

### Detener la Base de Datos

```bash
# Detener el contenedor
docker-compose -f docker-compose.dev.yml down

# Detener y eliminar volúmenes (CUIDADO: esto borra todos los datos)
docker-compose -f docker-compose.dev.yml down -v
```

### Conectarse a la Base de Datos

**Credenciales por defecto:**
- Host: `localhost`
- Puerto: `5432`
- Database: `bookings-software`
- Usuario: `postgres`
- Password: `postgres`

**Usando psql:**
```bash
docker exec -it postgres psql -U postgres -d bookings-software
```

**Usando un cliente GUI:**
- DBeaver
- pgAdmin
- TablePlus
- DataGrip

### Ejecutar Migraciones

```bash
# Asegúrate de tener las variables de entorno configuradas
cp .env.example .env

# Ejecutar migraciones
npm run migration:run
```

### Comandos Útiles

```bash
# Ver estado del contenedor
docker-compose -f docker-compose.dev.yml ps

# Reiniciar el contenedor
docker-compose -f docker-compose.dev.yml restart

# Ver logs en tiempo real
docker-compose -f docker-compose.dev.yml logs -f

# Acceder al shell del contenedor
docker exec -it postgres sh
```

## Troubleshooting

### Puerto 5432 ya está en uso

Si tienes PostgreSQL instalado localmente, puede estar usando el puerto 5432. Opciones:

1. Detener PostgreSQL local: `brew services stop postgresql` (macOS)
2. Cambiar el puerto en `docker-compose.dev.yml`: `- '5433:5432'`

### El contenedor no inicia

```bash
# Ver logs detallados
docker-compose -f docker-compose.dev.yml logs postgres

# Eliminar volúmenes y reintentar
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```
