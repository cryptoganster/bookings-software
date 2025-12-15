#!/bin/bash

# Script para configurar la base de datos de test

CONTAINER_ID="d34910175f02c098529bedd75a1b32ebb34bd4de4876595320303c30dd48bca0"

echo "Verificando si la base de datos bookings_test existe..."

# Verificar si la base de datos existe
DB_EXISTS=$(docker exec $CONTAINER_ID psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='bookings_test'")

if [ "$DB_EXISTS" = "1" ]; then
    echo "✓ Base de datos bookings_test ya existe"
else
    echo "Creando base de datos bookings_test..."
    docker exec $CONTAINER_ID psql -U postgres -c "CREATE DATABASE bookings_test;"
    echo "✓ Base de datos bookings_test creada"
fi

echo "✓ Configuración completada"
