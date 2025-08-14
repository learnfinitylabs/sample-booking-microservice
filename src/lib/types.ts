export interface Tenant {
	id: string;
	name: string;
	domain?: string;
	apiKey: string;
	settings?: Record<string, any>;
	createdAt: Date;
	updatedAt: Date;
	isActive: boolean;
}

export interface User {
	id: string;
	tenantId: string;
	email: string;
	passwordHash?: string;
	firstName?: string;
	lastName?: string;
	role: 'admin' | 'user' | 'guest';
	timezone: string;
	createdAt: Date;
	updatedAt: Date;
	isActive: boolean;
}

export interface Resource {
	id: string;
	tenantId: string;
	name: string;
	description?: string;
	category?: string;
	capacity: number;
	location?: string;
	settings?: Record<string, any>;
	createdAt: Date;
	updatedAt: Date;
	isActive: boolean;
}

export interface Booking {
	id: string;
	tenantId: string;
	resourceId: string;
	userId?: string;
	title: string;
	description?: string;
	startTime: string; // ISO string for API compatibility
	endTime: string; // ISO string for API compatibility
	status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
	externalReference?: string;
	metadata?: Record<string, any>;
	createdAt: Date;
	updatedAt: Date;
	// Additional properties from API responses
	resourceName?: string;
	resourceCategory?: string;
	userDisplayName?: string;
}

export interface AvailabilityWindow {
	id: string;
	tenantId: string;
	resourceId: string;
	dayOfWeek: number; // 0=Sunday, 6=Saturday
	startTime: string; // HH:MM format
	endTime: string; // HH:MM format
	isAvailable: boolean;
	effectiveFrom?: Date;
	effectiveUntil?: Date;
	createdAt: Date;
}

export interface CreateBookingRequest {
	resourceId: string;
	title: string;
	description?: string;
	startTime: string; // ISO string
	endTime: string; // ISO string
	userId?: string;
	externalReference?: string;
	metadata?: Record<string, any>;
}

export interface UpdateBookingRequest {
	title?: string;
	description?: string;
	startTime?: string;
	endTime?: string;
	status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
	metadata?: Record<string, any>;
}

export interface BookingQuery {
	resourceId?: string;
	userId?: string;
	status?: string;
	startDate?: string;
	endDate?: string;
	limit?: number;
	offset?: number;
}

export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}
