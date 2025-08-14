import type { RequestHandler } from './$types.js';
import { getDbConnection } from '$lib/server/database.js';
import { requireTenant, optionalUser, errorResponse, successResponse } from '$lib/server/middleware.js';
import { startOfMonth, endOfMonth, format, addDays, startOfDay } from 'date-fns';

// GET /api/calendar - Get calendar view of bookings
export const GET: RequestHandler = async (event) => {
	try {
		const tenant = await requireTenant(event);
		const user = await optionalUser(event, tenant);
		const url = new URL(event.request.url);
		
		// Parse query parameters
		const monthParam = url.searchParams.get('month'); // YYYY-MM format
		const resourceIdParam = url.searchParams.get('resource_id');
		const viewParam = url.searchParams.get('view') || 'month'; // month, week, day
		
		let startDate: Date;
		let endDate: Date;
		
		if (monthParam) {
			const [year, month] = monthParam.split('-').map(Number);
			if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
				return errorResponse('Invalid month format. Use YYYY-MM format.');
			}
			startDate = startOfMonth(new Date(year, month - 1));
			endDate = endOfMonth(startDate);
		} else {
			// Default to current month
			const now = new Date();
			startDate = startOfMonth(now);
			endDate = endOfMonth(now);
		}
		
		const db = await getDbConnection();
		
		// Build query based on filters
		let sql = `
			SELECT 
				b.*,
				r.name as resource_name,
				r.category as resource_category,
				u.first_name,
				u.last_name,
				u.email
			FROM bookings b
			LEFT JOIN resources r ON b.resource_id = r.id
			LEFT JOIN users u ON b.user_id = u.id
			WHERE b.tenant_id = ? 
			AND b.start_time < ? 
			AND b.end_time > ?
			AND b.status NOT IN ('cancelled')
		`;
		
		const params: any[] = [tenant.id, endDate, startDate];
		
		if (resourceIdParam) {
			sql += ' AND b.resource_id = ?';
			params.push(resourceIdParam);
		}
		
		// If user is not admin, filter by their bookings only
		if (user && user.role !== 'admin') {
			sql += ' AND b.user_id = ?';
			params.push(user.id);
		}
		
		sql += ' ORDER BY b.start_time ASC';
		
		const [rows] = await db.execute(sql, params);
		
		const bookings = Array.isArray(rows) ? rows.map((row: any) => {
			let metadata = null;
			if (row.metadata) {
				try {
					// Check if metadata is already an object or a valid JSON string
					if (typeof row.metadata === 'object') {
						metadata = row.metadata;
					} else if (typeof row.metadata === 'string' && row.metadata !== '[object Object]') {
						metadata = JSON.parse(row.metadata);
					}
				} catch (error) {
					console.warn('Failed to parse metadata for booking', row.id, ':', error);
					metadata = null;
				}
			}

			return {
				id: row.id,
				resourceId: row.resource_id,
				resourceName: row.resource_name,
				resourceCategory: row.resource_category,
				userId: row.user_id,
				userDisplayName: row.first_name && row.last_name 
					? `${row.first_name} ${row.last_name}`
					: row.email,
				title: row.title,
				description: row.description,
				startTime: new Date(row.start_time).toISOString(),
				endTime: new Date(row.end_time).toISOString(),
				status: row.status,
				externalReference: row.external_reference,
				metadata
			};
		}) : [];
		
		// Get all resources for the tenant
		const [resourceRows] = await db.execute(
			'SELECT id, name, category, capacity FROM resources WHERE tenant_id = ? AND is_active = TRUE ORDER BY name',
			[tenant.id]
		);
		
		const resources = Array.isArray(resourceRows) ? resourceRows.map((row: any) => ({
			id: row.id,
			name: row.name,
			category: row.category,
			capacity: row.capacity
		})) : [];
		
		// Generate calendar grid for month view
		const calendarDays = [];
		if (viewParam === 'month') {
			let currentDate = startOfDay(startDate);
			while (currentDate <= endDate) {
				const dayBookings = bookings.filter(booking => {
					const bookingStart = new Date(booking.startTime);
					const bookingEnd = new Date(booking.endTime);
					return (
						(bookingStart <= currentDate && bookingEnd > currentDate) ||
						(format(bookingStart, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd'))
					);
				});
				
				calendarDays.push({
					date: format(currentDate, 'yyyy-MM-dd'),
					dayOfWeek: currentDate.getDay(),
					bookings: dayBookings
				});
				
				currentDate = addDays(currentDate, 1);
			}
		}
		
		const response = {
			period: {
				start: startDate.toISOString(),
				end: endDate.toISOString(),
				view: viewParam
			},
			bookings,
			resources,
			...(viewParam === 'month' && { calendarDays }),
			summary: {
				totalBookings: bookings.length,
				confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
				pendingBookings: bookings.filter(b => b.status === 'pending').length
			}
		};
		
		return successResponse(response);
		
	} catch (error) {
		console.error('Error fetching calendar:', error);
		return errorResponse(error instanceof Error ? error.message : 'Failed to fetch calendar', 500);
	}
};
