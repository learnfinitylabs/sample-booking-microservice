import { getDbConnection } from './database.js';
import { v4 as uuidv4 } from 'uuid';
import type { 
	Booking, 
	CreateBookingRequest, 
	UpdateBookingRequest, 
	BookingQuery,
	Resource 
} from '../types.js';

export class BookingService {
	
	async createBooking(tenantId: string, request: CreateBookingRequest): Promise<Booking> {
		const db = await getDbConnection();
		
		// Validate resource exists and belongs to tenant
		const [resourceRows] = await db.execute(
			'SELECT * FROM resources WHERE id = ? AND tenant_id = ? AND is_active = TRUE',
			[request.resourceId, tenantId]
		);
		
		if (!Array.isArray(resourceRows) || resourceRows.length === 0) {
			throw new Error('Resource not found or not available');
		}
		
		const resource = resourceRows[0] as Resource;
		
		// Check for conflicts
		const hasConflict = await this.checkBookingConflict(
			tenantId,
			request.resourceId,
			new Date(request.startTime),
			new Date(request.endTime)
		);
		
		if (hasConflict) {
			throw new Error('Booking conflict: Resource is already booked for this time period');
		}
		
		// Validate booking is within resource availability
		const isAvailable = await this.checkResourceAvailability(
			tenantId,
			request.resourceId,
			new Date(request.startTime),
			new Date(request.endTime)
		);
		
		if (!isAvailable) {
			throw new Error('Resource is not available during the requested time period');
		}
		
		const bookingId = uuidv4();
		const now = new Date();
		
		await db.execute(
			`INSERT INTO bookings (
				id, tenant_id, resource_id, user_id, title, description, 
				start_time, end_time, status, external_reference, metadata, 
				created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				bookingId,
				tenantId,
				request.resourceId,
				request.userId || null,
				request.title,
				request.description || null,
				request.startTime,
				request.endTime,
				'pending',
				request.externalReference || null,
				request.metadata ? JSON.stringify(request.metadata) : null,
				now,
				now
			]
		);
		
		// Log the booking creation
		await this.logBookingHistory(tenantId, bookingId, 'created', null, request, request.userId);
		
		return this.getBookingById(tenantId, bookingId);
	}
	
	async updateBooking(tenantId: string, bookingId: string, request: UpdateBookingRequest, userId?: string): Promise<Booking> {
		const db = await getDbConnection();
		
		// Get current booking
		const currentBooking = await this.getBookingById(tenantId, bookingId);
		
		// Check for conflicts if time is being changed
		if (request.startTime || request.endTime) {
			const startTime = new Date(request.startTime || currentBooking.startTime);
			const endTime = new Date(request.endTime || currentBooking.endTime);
			
			const hasConflict = await this.checkBookingConflict(
				tenantId,
				currentBooking.resourceId,
				startTime,
				endTime,
				bookingId // exclude current booking from conflict check
			);
			
			if (hasConflict) {
				throw new Error('Booking conflict: Resource is already booked for this time period');
			}
		}
		
		const updateFields = [];
		const updateValues = [];
		
		if (request.title !== undefined) {
			updateFields.push('title = ?');
			updateValues.push(request.title);
		}
		if (request.description !== undefined) {
			updateFields.push('description = ?');
			updateValues.push(request.description);
		}
		if (request.startTime !== undefined) {
			updateFields.push('start_time = ?');
			updateValues.push(request.startTime);
		}
		if (request.endTime !== undefined) {
			updateFields.push('end_time = ?');
			updateValues.push(request.endTime);
		}
		if (request.status !== undefined) {
			updateFields.push('status = ?');
			updateValues.push(request.status);
		}
		if (request.metadata !== undefined) {
			updateFields.push('metadata = ?');
			updateValues.push(JSON.stringify(request.metadata));
		}
		
		updateFields.push('updated_at = ?');
		updateValues.push(new Date());
		
		updateValues.push(bookingId, tenantId);
		
		await db.execute(
			`UPDATE bookings SET ${updateFields.join(', ')} WHERE id = ? AND tenant_id = ?`,
			updateValues
		);
		
		// Log the booking update
		await this.logBookingHistory(tenantId, bookingId, 'updated', currentBooking, request, userId);
		
		return this.getBookingById(tenantId, bookingId);
	}
	
	async deleteBooking(tenantId: string, bookingId: string, userId?: string): Promise<void> {
		const db = await getDbConnection();
		
		const currentBooking = await this.getBookingById(tenantId, bookingId);
		
		await db.execute(
			'UPDATE bookings SET status = ?, updated_at = ? WHERE id = ? AND tenant_id = ?',
			['cancelled', new Date(), bookingId, tenantId]
		);
		
		await this.logBookingHistory(tenantId, bookingId, 'cancelled', currentBooking, { status: 'cancelled' }, userId);
	}
	
	async getBookingById(tenantId: string, bookingId: string): Promise<Booking> {
		const db = await getDbConnection();
		
		const [rows] = await db.execute(
			'SELECT * FROM bookings WHERE id = ? AND tenant_id = ?',
			[bookingId, tenantId]
		);
		
		if (!Array.isArray(rows) || rows.length === 0) {
			throw new Error('Booking not found');
		}
		
		return this.mapRowToBooking(rows[0] as any);
	}
	
	async getBookings(tenantId: string, query: BookingQuery = {}): Promise<Booking[]> {
		const db = await getDbConnection();
		
		let sql = 'SELECT * FROM bookings WHERE tenant_id = ?';
		const params: any[] = [tenantId];
		
		if (query.resourceId) {
			sql += ' AND resource_id = ?';
			params.push(query.resourceId);
		}
		
		if (query.userId) {
			sql += ' AND user_id = ?';
			params.push(query.userId);
		}
		
		if (query.status) {
			sql += ' AND status = ?';
			params.push(query.status);
		}
		
		if (query.startDate) {
			sql += ' AND start_time >= ?';
			params.push(query.startDate);
		}
		
		if (query.endDate) {
			sql += ' AND end_time <= ?';
			params.push(query.endDate);
		}
		
		sql += ' ORDER BY start_time ASC';
		
		if (query.limit) {
			sql += ' LIMIT ?';
			params.push(query.limit);
			
			if (query.offset) {
				sql += ' OFFSET ?';
				params.push(query.offset);
			}
		}
		
		const [rows] = await db.execute(sql, params);
		
		if (!Array.isArray(rows)) {
			return [];
		}
		
		return rows.map(row => this.mapRowToBooking(row as any));
	}
	
	private async checkBookingConflict(
		tenantId: string,
		resourceId: string,
		startTime: Date,
		endTime: Date,
		excludeBookingId?: string
	): Promise<boolean> {
		const db = await getDbConnection();
		
		let sql = `
			SELECT COUNT(*) as count FROM bookings 
			WHERE tenant_id = ? AND resource_id = ? 
			AND status NOT IN ('cancelled', 'completed')
			AND (
				(start_time <= ? AND end_time > ?) OR
				(start_time < ? AND end_time >= ?) OR
				(start_time >= ? AND end_time <= ?)
			)
		`;
		
		const params = [
			tenantId, resourceId,
			startTime, startTime,
			endTime, endTime,
			startTime, endTime
		];
		
		if (excludeBookingId) {
			sql += ' AND id != ?';
			params.push(excludeBookingId);
		}
		
		const [rows] = await db.execute(sql, params);
		const count = (rows as any)[0].count;
		
		return count > 0;
	}
	
	private async checkResourceAvailability(
		tenantId: string,
		resourceId: string,
		startTime: Date,
		endTime: Date
	): Promise<boolean> {
		const db = await getDbConnection();
		
		// For now, assume resources are available 24/7
		// In a real implementation, you'd check availability_windows table
		// and any special holiday/blackout dates
		
		return true; // Simplified for demo
	}
	
	private async logBookingHistory(
		tenantId: string,
		bookingId: string,
		action: 'created' | 'updated' | 'cancelled' | 'confirmed',
		oldValues: any,
		newValues: any,
		userId?: string
	): Promise<void> {
		const db = await getDbConnection();
		
		await db.execute(
			`INSERT INTO booking_history (
				id, tenant_id, booking_id, action, old_values, new_values, performed_by, performed_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				uuidv4(),
				tenantId,
				bookingId,
				action,
				oldValues ? JSON.stringify(oldValues) : null,
				JSON.stringify(newValues),
				userId || null,
				new Date()
			]
		);
	}
	
	private mapRowToBooking(row: any): Booking {
		return {
			id: row.id,
			tenantId: row.tenant_id,
			resourceId: row.resource_id,
			userId: row.user_id,
			title: row.title,
			description: row.description,
			startTime: new Date(row.start_time),
			endTime: new Date(row.end_time),
			status: row.status,
			externalReference: row.external_reference,
			metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : null,
			createdAt: new Date(row.created_at),
			updatedAt: new Date(row.updated_at)
		};
	}
}
