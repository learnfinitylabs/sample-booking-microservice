import type { RequestHandler } from './$types.js';
import { getDbConnection } from '$lib/server/database.js';
import { requireTenant, errorResponse, successResponse } from '$lib/server/middleware.js';
import type { Resource } from '$lib/types.js';

// GET /api/resources - List all resources for tenant
export const GET: RequestHandler = async (event) => {
	try {
		const tenant = await requireTenant(event);
		const db = await getDbConnection();
		
		const [rows] = await db.execute(
			'SELECT * FROM resources WHERE tenant_id = ? AND is_active = TRUE ORDER BY name',
			[tenant.id]
		);
		
		if (!Array.isArray(rows)) {
			return successResponse([]);
		}
		
		const resources: Resource[] = rows.map((row: any) => ({
			id: row.id,
			tenantId: row.tenant_id,
			name: row.name,
			description: row.description,
			category: row.category,
			capacity: row.capacity,
			location: row.location,
			settings: row.settings ? (typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings) : null,
			createdAt: new Date(row.created_at),
			updatedAt: new Date(row.updated_at),
			isActive: row.is_active
		}));
		
		return successResponse(resources);
		
	} catch (error) {
		console.error('Error fetching resources:', error);
		return errorResponse(error instanceof Error ? error.message : 'Failed to fetch resources', 500);
	}
};
