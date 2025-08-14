import mysql from 'mysql2/promise';
import { DB_CONFIG } from './config.js';

let connection: mysql.Connection | null = null;

export async function getDbConnection(): Promise<mysql.Connection> {
	if (!connection) {
		connection = await mysql.createConnection(DB_CONFIG);
	}
	return connection;
}

export async function closeDbConnection(): Promise<void> {
	if (connection) {
		await connection.end();
		connection = null;
	}
}
