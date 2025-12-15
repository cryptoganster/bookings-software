#!/bin/bash

# Script para configurar las bases de datos de test
# Crea múltiples bases de datos para workers paralelos de Jest

CONTAINER_ID="d34910175f02c098529bedd75a1b32ebb34bd4de4876595320303c30dd48bca0"
MAX_WORKERS=10

echo "Configurando bases de datos de test para Jest workers..."

# Crear base de datos principal
DB_EXISTS=$(docker exec $CONTAINER_ID psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='bookings_test'")
if [ "$DB_EXISTS" != "1" ]; then
    echo "Creando base de datos bookings_test..."
    docker exec $CONTAINER_ID psql -U postgres -c "CREATE DATABASE bookings_test;"
    echo "✓ Base de datos bookings_test creada"
else
    echo "✓ Base de datos bookings_test ya existe"
fi

# Crear bases de datos para cada worker
for i in $(seq 1 $MAX_WORKERS); do
    DB_NAME="bookings_test_$i"
    DB_EXISTS=$(docker exec $CONTAINER_ID psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")
    
    if [ "$DB_EXISTS" != "1" ]; then
        echo "Creando base de datos $DB_NAME..."
        docker exec $CONTAINER_ID psql -U postgres -c "CREATE DATABASE $DB_NAME;"
        echo "✓ Base de datos $DB_NAME creada"
    else
        echo "✓ Base de datos $DB_NAME ya existe"
    fi
done

echo ""
echo "✓ Configuración completada - $(($MAX_WORKERS + 1)) bases de datos listas"
