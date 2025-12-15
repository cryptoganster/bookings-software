// ESTE ARCHIVO ES SOLO PARA PROBAR LAS REGLAS
// Debe generar errores de boundaries

// ❌ Violación: Domain importando de App
import { CreateAppointmentHandler } from '../app/commands/create-appointment/handler';

// ❌ Violación: Domain importando framework NestJS
import { Injectable } from '@nestjs/common';

// ❌ Violación: Domain importando TypeORM
import { Repository } from 'typeorm';

export class TestBoundaryViolation {}
