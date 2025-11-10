/**
 * Run database schema using Node.js
 * This script reads the schema.sql file and executes it using the database connection
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './src/adapters/outbound/postgres/database/connection';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSchema() {
  console.log('========================================');
  console.log('Running Database Schema');
  console.log('========================================');
  console.log('');

  // Check if DB_HOST is set
  if (!process.env.DB_HOST) {
    console.log('⚠️  DB_HOST not set. Using mock database.');
    console.log('   To use PostgreSQL, set DB_HOST in your .env file.');
    console.log('');
    process.exit(0);
  }

  // Read schema file
  const schemaPath = path.join(__dirname, 'database', 'schema.sql');
  
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Schema file not found at:', schemaPath);
    process.exit(1);
  }

  console.log('📄 Reading schema file:', schemaPath);
  const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

  console.log('⏳ Executing schema...');
  console.log('');

  const client = await pool.connect();

  try {
    // Execute the entire schema file as one transaction
    // PostgreSQL can handle multiple statements separated by semicolons
    await client.query('BEGIN');
    await client.query(schemaSQL);
    await client.query('COMMIT');
    console.log('');
    console.log('✅ Schema executed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Start the server: npm run dev');
    console.log('  2. Test the APIs using Postman or the frontend');
  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => {}); // Ignore rollback errors
    console.error('');
    console.error('❌ Error running schema:', error.message);
    console.error('');
    
    // Provide helpful error messages based on error code
    if (error.code === '28P01') {
      console.error('🔐 Password authentication failed!');
      console.error('');
      console.error('💡 Solution: Create a .env file in the backend folder with your PostgreSQL password:');
      console.error('');
      console.error('   DB_HOST=localhost');
      console.error('   DB_PORT=5432');
      console.error('   DB_NAME=fuel_eu_maritime');
      console.error('   DB_USER=postgres');
      console.error('   DB_PASSWORD=your_actual_password_here');
      console.error('');
      console.error('   Replace "your_actual_password_here" with your PostgreSQL password.');
    } else if (error.code === '42P01') {
      console.error('💡 Tip: Make sure the database "fuel_eu_maritime" exists.');
      console.error('   Run: CREATE DATABASE fuel_eu_maritime;');
    } else if (error.code === '3D000') {
      console.error('💡 Tip: The database "fuel_eu_maritime" does not exist.');
      console.error('   Run: CREATE DATABASE fuel_eu_maritime;');
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runSchema().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

