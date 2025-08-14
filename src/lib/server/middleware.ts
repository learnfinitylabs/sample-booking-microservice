import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { getDbConnection } from './database.js';
import { verifyToken, extractTenantFromApiKey } from './auth.js';
import type { Tenant, User, ApiResponse } from '../types.js';

export interface AuthenticatedRequest extends RequestEvent {
	tenant: Tenant;
	user?: User;
}

export async function validateApiKey(apiKey: string): Promise<Tenant | null> {
	if (!apiKey) return null;
	
	const db = await getDbConnection();
	
	const [rows] = await db.execute(
		'SELECT * FROM tenants WHERE api_key = ? AND is_active = TRUE',
		[apiKey]
	);
	
	if (!Array.isArray(rows) || rows.length === 0) {
		return null;
	}
	
	const row = rows[0] as any;
	return {
		id: row.id,
		name: row.name,
		domain: row.domain,
		apiKey: row.api_key,
		settings: row.settings ? (typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings) : null,
		createdAt: new Date(row.created_at),
		updatedAt: new Date(row.updated_at),
		isActive: row.is_active
	};
}

export async function validateUserToken(token: string): Promise<User | null> {
	const payload = verifyToken(token);
	if (!payload) return null;
	
	const db = await getDbConnection();
	
	const [rows] = await db.execute(
		'SELECT * FROM users WHERE id = ? AND tenant_id = ? AND is_active = TRUE',
		[payload.userId, payload.tenantId]
	);
	
	if (!Array.isArray(rows) || rows.length === 0) {
		return null;
	}
	
	const row = rows[0] as any;
	return {
		id: row.id,
		tenantId: row.tenant_id,
		email: row.email,
		firstName: row.first_name,
		lastName: row.last_name,
		role: row.role,
		timezone: row.timezone,
		createdAt: new Date(row.created_at),
		updatedAt: new Date(row.updated_at),
		isActive: row.is_active
	};
}

export async function requireTenant(event: RequestEvent): Promise<Tenant> {
	const apiKey = event.request.headers.get('x-api-key') || 
				  event.url.searchParams.get('api_key');
	
	if (!apiKey) {
		throw new Error('API key is required');
	}
	
	const tenant = await validateApiKey(apiKey);
	if (!tenant) {
		throw new Error('Invalid or inactive API key');
	}
	
	return tenant;
}

export async function optionalUser(event: RequestEvent, tenant: Tenant): Promise<User | null> {
	const authHeader = event.request.headers.get('authorization');
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return null;
	}
	
	const token = authHeader.substring(7);
	const user = await validateUserToken(token);
	
	// Ensure user belongs to the same tenant
	if (user && user.tenantId !== tenant.id) {
		return null;
	}
	
	return user;
}

export async function requireUser(event: RequestEvent, tenant: Tenant): Promise<User> {
	const user = await optionalUser(event, tenant);
	if (!user) {
		throw new Error('Authentication required');
	}
	return user;
}

export function errorResponse(message: string, status = 400): Response {
	const response: ApiResponse = {
		success: false,
		error: message
	};
	return json(response, { status });
}

export function successResponse<T>(data: T, message?: string): Response {
	const response: ApiResponse<T> = {
		success: true,
		data,
		message
	};
	return json(response);
}
