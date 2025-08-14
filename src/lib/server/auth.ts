import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_SECRET } from './config.js';
import type { User, Tenant } from '../types.js';

export interface JwtPayload {
	userId: string;
	tenantId: string;
	role: string;
	email: string;
}

export function generateToken(user: User): string {
	const payload: JwtPayload = {
		userId: user.id,
		tenantId: user.tenantId,
		role: user.role,
		email: user.email
	};
	
	return jwt.sign(payload, JWT_SECRET, { 
		expiresIn: '24h',
		issuer: 'booking-microservice'
	});
}

export function verifyToken(token: string): JwtPayload | null {
	try {
		const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
		return decoded;
	} catch (error) {
		return null;
	}
}

export async function hashPassword(password: string): Promise<string> {
	const salt = await bcrypt.genSalt(12);
	return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

export function extractTenantFromApiKey(apiKey: string): { tenantId: string } | null {
	// Extract tenant info from API key format: tenant_id.random_string
	const parts = apiKey.split('.');
	if (parts.length === 2) {
		return { tenantId: parts[0] };
	}
	return null;
}

export function generateApiKey(tenantId: string): string {
	const randomString = Math.random().toString(36).substring(2, 15) + 
					   Math.random().toString(36).substring(2, 15);
	return `${tenantId}.${randomString}`;
}
