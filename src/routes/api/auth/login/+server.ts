import type { RequestHandler } from './$types.js';
import { getDbConnection } from '$lib/server/database.js';
import { requireTenant, errorResponse, successResponse } from '$lib/server/middleware.js';
import { verifyPassword, generateToken } from '$lib/server/auth.js';
import type { User } from '$lib/types.js';

// POST /api/auth/login - User login
export const POST: RequestHandler = async (event) => {
	try {
		const tenant = await requireTenant(event);
		const { email, password } = await event.request.json();
		
		if (!email || !password) {
			return errorResponse('Email and password are required');
		}
		
		const db = await getDbConnection();
		
		// Find user by email within tenant
		const [rows] = await db.execute(
			'SELECT * FROM users WHERE email = ? AND tenant_id = ? AND is_active = TRUE',
			[email, tenant.id]
		);
		
		if (!Array.isArray(rows) || rows.length === 0) {
			return errorResponse('Invalid credentials', 401);
		}
		
		const userRow = rows[0] as any;
		
		// Verify password
		if (!userRow.password_hash) {
			return errorResponse('Password authentication not enabled for this user', 401);
		}
		
		const isValidPassword = await verifyPassword(password, userRow.password_hash);
		if (!isValidPassword) {
			return errorResponse('Invalid credentials', 401);
		}
		
		// Create user object
		const user: User = {
			id: userRow.id,
			tenantId: userRow.tenant_id,
			email: userRow.email,
			firstName: userRow.first_name,
			lastName: userRow.last_name,
			role: userRow.role,
			timezone: userRow.timezone,
			createdAt: new Date(userRow.created_at),
			updatedAt: new Date(userRow.updated_at),
			isActive: userRow.is_active
		};
		
		// Generate JWT token
		const token = generateToken(user);
		
		// Update last login
		await db.execute(
			'UPDATE users SET last_login_at = NOW() WHERE id = ? AND tenant_id = ?',
			[user.id, tenant.id]
		);
		
		return successResponse({
			user: {
				id: user.id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				role: user.role,
				timezone: user.timezone
			},
			token,
			expiresIn: '24h'
		}, 'Login successful');
		
	} catch (error) {
		console.error('Login error:', error);
		return errorResponse(error instanceof Error ? error.message : 'Login failed', 500);
	}
};
