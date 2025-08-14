import type { RequestHandler } from './$types.js';
import { json } from '@sveltejs/kit';
import { getDbConnection } from '$lib/server/database.js';

export const GET: RequestHandler = async () => {
	const health = {
		status: 'healthy',
		timestamp: new Date().toISOString(),
		version: '1.0.0',
		services: {
			database: 'unknown',
			api: 'healthy'
		}
	};
	
	try {
		// Test database connection
		const db = await getDbConnection();
		await db.execute('SELECT 1');
		health.services.database = 'healthy';
	} catch (error) {
		health.status = 'unhealthy';
		health.services.database = 'unhealthy';
	}
	
	const statusCode = health.status === 'healthy' ? 200 : 503;
	
	return json(health, { status: statusCode });
};
