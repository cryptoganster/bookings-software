# Database

Esta carpeta contiene las migraciones y seeds de la base de datos.

## Estructura

```
database/
├── migrations/     # Migraciones de TypeORM
└── seeds/         # Scripts de seed para datos iniciales
```

## Comandos útiles

### Generar una migración

```bash
npm run migration:generate -- src/database/migrations/NombreDeLaMigracion
```

### Ejecutar migraciones

```bash
npm run migration:run
```

### Revertir última migración

```bash
npm run migration:revert
```

### Ejecutar seeds

```bash
npm run seed
```

## Configuración

La configuración del DataSource se encuentra en `src/config/database.ts`.

Las migraciones se generan automáticamente comparando las entidades TypeORM con el esquema actual de la base de datos.
