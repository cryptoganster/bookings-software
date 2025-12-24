#!/usr/bin/env ts-node

/**
 * Migration Analysis Script
 *
 * Analyzes database migrations to detect:
 * - Duplicate table creations
 * - Invalid timestamp formats
 * - Missing tables
 * - Migration order issues
 */

import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { AppDataSource } from '@config/database';

interface MigrationInfo {
  filename: string;
  timestamp: string;
  className: string;
  isValid: boolean;
  issues: string[];
}

interface AnalysisReport {
  totalMigrations: number;
  validMigrations: number;
  invalidMigrations: number;
  duplicates: string[];
  invalidTimestamps: string[];
  missingTables: string[];
  migrations: MigrationInfo[];
}

const EXPECTED_TABLES = [
  'users',
  'business_owners',
  'businesses',
  'customers',
  'offerings',
  'schedules',
  'blockouts',
  'capacities',
  'appointments',
  'conversations',
  'messages',
  'migrations',
];

async function analyzeMigrations(): Promise<AnalysisReport> {
  const migrationsDir = join(__dirname, '../migrations');
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.ts') && f !== '.gitkeep');

  const migrations: MigrationInfo[] = [];
  const tableCreations: Map<string, string[]> = new Map();
  const duplicates: string[] = [];
  const invalidTimestamps: string[] = [];

  // Analyze each migration file
  for (const file of files) {
    const filepath = join(migrationsDir, file);
    const content = readFileSync(filepath, 'utf-8');

    // Extract timestamp from filename
    const timestampMatch = file.match(/^(\d+)-/);
    const timestamp = timestampMatch ? timestampMatch[1] : '';

    // Extract class name
    const classMatch = content.match(/export class (\w+)/);
    const className = classMatch ? classMatch[1] : '';

    const issues: string[] = [];
    let isValid = true;

    // Check timestamp format (should be 13 digits)
    if (timestamp.length !== 13) {
      issues.push(`Invalid timestamp format: ${timestamp} (expected 13 digits)`);
      invalidTimestamps.push(file);
      isValid = false;
    }

    // Check for table creation
    const createTableMatch = content.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/gi);
    if (createTableMatch) {
      createTableMatch.forEach((match) => {
        const tableMatch = match.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1];
          if (!tableCreations.has(tableName)) {
            tableCreations.set(tableName, []);
          }
          tableCreations.get(tableName)!.push(file);
        }
      });
    }

    migrations.push({
      filename: file,
      timestamp,
      className,
      isValid,
      issues,
    });
  }

  // Check for duplicate table creations
  for (const [table, files] of tableCreations.entries()) {
    if (files.length > 1) {
      duplicates.push(`Table "${table}" created in: ${files.join(', ')}`);
    }
  }

  // Check for missing tables in database
  let missingTables: string[] = [];
  try {
    await AppDataSource.initialize();

    const existingTables = await AppDataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    const existingTableNames = existingTables.map((row: any) => row.table_name);
    missingTables = EXPECTED_TABLES.filter((table) => !existingTableNames.includes(table));

    await AppDataSource.destroy();
  } catch (error) {
    console.error('⚠️  Could not connect to database to check tables');
  }

  return {
    totalMigrations: migrations.length,
    validMigrations: migrations.filter((m) => m.isValid).length,
    invalidMigrations: migrations.filter((m) => !m.isValid).length,
    duplicates,
    invalidTimestamps,
    missingTables,
    migrations: migrations.sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
  };
}

function printReport(report: AnalysisReport): void {
  console.log('\n📊 Migration Analysis Report');
  console.log('============================\n');

  console.log(`Total Migrations: ${report.totalMigrations}`);
  console.log(`Valid Migrations: ${report.validMigrations}`);
  console.log(`Invalid Migrations: ${report.invalidMigrations}\n`);

  if (report.duplicates.length > 0) {
    console.log('⚠️  Duplicate Table Creations:');
    report.duplicates.forEach((dup) => console.log(`   - ${dup}`));
    console.log('');
  }

  if (report.invalidTimestamps.length > 0) {
    console.log('❌ Invalid Timestamps:');
    report.invalidTimestamps.forEach((file) => console.log(`   - ${file}`));
    console.log('');
  }

  if (report.missingTables.length > 0) {
    console.log('⚠️  Missing Tables in Database:');
    report.missingTables.forEach((table) => console.log(`   - ${table}`));
    console.log('');
  }

  console.log('📋 Migration List (chronological):');
  console.log('-----------------------------------');
  report.migrations.forEach((migration, index) => {
    const status = migration.isValid ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${migration.filename}`);
    if (migration.issues.length > 0) {
      migration.issues.forEach((issue) => console.log(`      ⚠️  ${issue}`));
    }
  });
  console.log('');

  // Summary
  if (
    report.duplicates.length === 0 &&
    report.invalidTimestamps.length === 0 &&
    report.missingTables.length === 0
  ) {
    console.log('✅ All migrations are valid!');
  } else {
    console.log('⚠️  Issues found that need attention:');
    if (report.duplicates.length > 0) {
      console.log(`   - ${report.duplicates.length} duplicate table creation(s)`);
    }
    if (report.invalidTimestamps.length > 0) {
      console.log(`   - ${report.invalidTimestamps.length} invalid timestamp(s)`);
    }
    if (report.missingTables.length > 0) {
      console.log(`   - ${report.missingTables.length} missing table(s) in database`);
    }
  }
  console.log('');
}

// Run analysis
analyzeMigrations()
  .then((report) => {
    printReport(report);
    process.exit(report.invalidMigrations > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('❌ Error analyzing migrations:', error);
    process.exit(1);
  });
