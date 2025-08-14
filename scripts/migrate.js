import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { join } from 'path';

const DB_CONFIG = {
	host: process.env.DB_HOST || 'localhost',
	port: parseInt(process.env.DB_PORT || '3306'),
	user: process.env.DB_USER || 'booking_user',
	password: process.env.DB_PASSWORD || 'booking_pass',
	multipleStatements: true
};

const DB_NAME = process.env.DB_NAME || 'booking_microservice';

async function migrate() {
	console.log('Starting database migration...');
	
	try {
		// Connect to MySQL server (without database)
		const connection = await mysql.createConnection(DB_CONFIG);
		
		// Create database if it doesn't exist
		console.log(`Creating database: ${DB_NAME}`);
		await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
		await connection.query(`USE \`${DB_NAME}\``);
		
		// Read and execute schema
		const schemaPath = join(process.cwd(), 'schema.sql');
		const schema = readFileSync(schemaPath, 'utf-8');
		
		console.log('Executing schema...');
		await connection.query(schema);
		
		console.log('Database migration completed successfully!');
		
		await connection.end();
		
	} catch (error) {
		console.error('Migration failed:', error);
		process.exit(1);
	}
}

migrate();
