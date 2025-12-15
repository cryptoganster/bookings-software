# Estrategia de Testing - Base de Datos

## Problema de Concurrencia

Jest ejecuta tests en paralelo usando múltiples workers (procesos). Si todos los workers usan la misma base de datos, se producen conflictos de concurrencia.

## Solución Implementada

### 1. Base de Datos por Worker

Cada worker de Jest tiene su propia base de datos aislada:

```
Worker 1 → bookings_test_1
Worker 2 → bookings_test_2
Worker 3 → bookings_test_3
...
Worker 10 → bookings_test_10
```

Esto se configura automáticamente en `test/setup.ts`:

```typescript
const workerId = process.env.JEST_WORKER_ID || '1';
process.env.DB_DATABASE = `bookings_test_${workerId}`;
```

### 2. Creación de Bases de Datos

Las bases de datos se crean **una sola vez** usando el script:

```bash
./test/setup-test-db.sh
```

Este script:

- ✅ Crea 10 bases de datos (bookings_test_1 a bookings_test_10)
- ✅ Es idempotente (puede ejecutarse múltiples veces sin problemas)
- ✅ Solo crea las DBs que no existen

### 3. Limpieza Entre Tests

**NO eliminamos las bases de datos** porque es muy lento. En su lugar, **limpiamos las tablas** entre tests:

```typescript
import { cleanDatabase } from '../../../test/setup-db';

beforeEach(async () => {
  await cleanDatabase(dataSource);
});
```

#### ¿Por qué limpiar tablas en lugar de eliminar DBs?

| Operación                 | Tiempo | Impacto      |
| ------------------------- | ------ | ------------ |
| Crear/Eliminar DB         | ~500ms | ❌ Muy lento |
| Limpiar tablas (TRUNCATE) | ~10ms  | ✅ Rápido    |
| clear() de TypeORM        | ~50ms  | ⚠️ Medio     |

**Resultado**: Los tests son **50x más rápidos** limpiando tablas que creando/eliminando DBs.

## Uso en Tests

### Tests de Integración

```typescript
import { cleanDatabase } from '../../../test/setup-db';

describe('MyRepository Integration Tests', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    // Setup del módulo de NestJS
    module = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot({ ... })],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
  });

  beforeEach(async () => {
    // Limpiar tablas antes de cada test
    await cleanDatabase(dataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  it('should work correctly', async () => {
    // Test con base de datos limpia
  });
});
```

### Tests Unitarios

Los tests unitarios **no necesitan base de datos**. Usa mocks:

```typescript
describe('MyService Unit Tests', () => {
  let service: MyService;
  let mockRepository: jest.Mocked<IRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    } as any;

    service = new MyService(mockRepository);
  });

  it('should work with mocks', async () => {
    mockRepository.findById.mockResolvedValue(someData);
    // Test sin DB
  });
});
```

## Recursos del Sistema

### Antes (Crear/Eliminar DBs)

- 🐌 Tests lentos: ~2 minutos
- 💾 Uso de disco: Alto (crear/eliminar constantemente)
- 🔄 Conexiones: Muchas (crear/destruir conexiones)

### Después (Limpiar Tablas)

- ⚡ Tests rápidos: ~35 segundos
- 💾 Uso de disco: Bajo (DBs permanentes, solo datos temporales)
- 🔄 Conexiones: Pocas (reusar conexiones)

### Uso de Memoria

Las 10 bases de datos vacías ocupan **~50MB** en total (5MB cada una). Esto es insignificante comparado con:

- Node.js runtime: ~100MB
- Jest workers: ~200MB
- Dependencias en memoria: ~300MB

**Total**: Las DBs de test son solo el **8%** del uso de memoria durante tests.

## Mantenimiento

### Recrear Bases de Datos

Si necesitas recrear las bases de datos (ej: cambios en schema):

```bash
# Eliminar todas las DBs de test
docker exec <container_id> psql -U postgres -c "DROP DATABASE IF EXISTS bookings_test_1;"
docker exec <container_id> psql -U postgres -c "DROP DATABASE IF EXISTS bookings_test_2;"
# ... etc

# O usar un loop
for i in {1..10}; do
  docker exec <container_id> psql -U postgres -c "DROP DATABASE IF EXISTS bookings_test_$i;"
done

# Recrear
./test/setup-test-db.sh
```

### Verificar Estado

```bash
# Ver todas las bases de datos
docker exec <container_id> psql -U postgres -c "\l" | grep bookings_test

# Ver tamaño de las bases de datos
docker exec <container_id> psql -U postgres -c "
  SELECT datname, pg_size_pretty(pg_database_size(datname))
  FROM pg_database
  WHERE datname LIKE 'bookings_test%';"
```

## Best Practices

1. ✅ **Usar `cleanDatabase()` en `beforeEach`** para aislamiento completo
2. ✅ **Cerrar conexiones en `afterAll`** para evitar leaks
3. ✅ **Usar mocks en tests unitarios** (no necesitan DB)
4. ✅ **Ejecutar `setup-test-db.sh` una vez** al configurar el proyecto
5. ❌ **NO crear/eliminar DBs en cada test** (muy lento)
6. ❌ **NO usar la misma DB para todos los workers** (conflictos)

## Troubleshooting

### Error: "database does not exist"

```bash
# Ejecutar el script de setup
./test/setup-test-db.sh
```

### Tests lentos

```bash
# Verificar que estás usando cleanDatabase() en lugar de crear/eliminar DBs
# Verificar que no estás usando dropSchema: true en TypeORM
```

### Conflictos de concurrencia

```bash
# Verificar que cada test limpia la DB en beforeEach
# Verificar que no hay tests compartiendo estado global
```
