import { json } from '@sveltejs/kit';
import { getConnection } from '$lib/server/database.js';

export async function GET() {
	try {
		const db = await getConnection();
		
		// Get all active tenants with their API keys
		const [rows] = await db.execute(`
			SELECT name, api_key, domain 
			FROM tenants 
			WHERE is_active = TRUE 
			ORDER BY name
		`);

		const tenants = Array.isArray(rows) ? rows.map((row: any) => ({
			name: row.name,
			apiKey: row.api_key,
			domain: row.domain
		})) : [];

		return json({
			success: true,
			data: {
				tenants,
				count: tenants.length
			}
		});
	} catch (error) {
		console.error('Error fetching tenants from database:', error);
		return json({
			success: false,
			error: 'Failed to fetch tenant configuration from database'
		}, { status: 500 });
	}
}
