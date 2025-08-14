import type { RequestHandler } from './$types.js';
import { getDbConnection } from '$lib/server/database.js';
import { requireTenant, errorResponse, successResponse } from '$lib/server/middleware.js';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';

// GET /api/resources/[id]/availability - Get availability for a specific resource
export const GET: RequestHandler = async (event) => {
	try {
		const tenant = await requireTenant(event);
		const resourceId = event.params.id;
		const url = new URL(event.request.url);
		
		if (!resourceId) {
			return errorResponse('Resource ID is required');
		}
		
		// Parse query parameters
		const startDateParam = url.searchParams.get('start_date');
		const endDateParam = url.searchParams.get('end_date');
		const durationParam = url.searchParams.get('duration'); // in minutes
		
		if (!startDateParam || !endDateParam) {
			return errorResponse('start_date and end_date parameters are required');
		}
		
		const startDate = new Date(startDateParam);
		const endDate = new Date(endDateParam);
		const duration = durationParam ? parseInt(durationParam) : 60; // default 1 hour
		
		if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
			return errorResponse('Invalid date format. Use ISO 8601 format.');
		}
		
		if (startDate >= endDate) {
			return errorResponse('Start date must be before end date');
		}
		
		const db = await getDbConnection();
		
		// Check if resource exists
		const [resourceRows] = await db.execute(
			'SELECT * FROM resources WHERE id = ? AND tenant_id = ? AND is_active = TRUE',
			[resourceId, tenant.id]
		);
		
		if (!Array.isArray(resourceRows) || resourceRows.length === 0) {
			return errorResponse('Resource not found', 404);
		}
		
		// Get existing bookings for the period
		const [bookingRows] = await db.execute(
			`SELECT start_time, end_time FROM bookings 
			 WHERE resource_id = ? AND tenant_id = ? 
			 AND status NOT IN ('cancelled', 'completed')
			 AND start_time < ? AND end_time > ?
			 ORDER BY start_time`,
			[resourceId, tenant.id, endDate, startDate]
		);
		
		const existingBookings = Array.isArray(bookingRows) ? bookingRows.map((row: any) => ({
			startTime: new Date(row.start_time),
			endTime: new Date(row.end_time)
		})) : [];
		
		// Generate available slots
		const availableSlots = [];
		const slotDurationMs = duration * 60 * 1000;
		
		let currentTime = startOfDay(startDate);
		const endTime = endOfDay(endDate);
		
		while (currentTime < endTime) {
			const slotEndTime = new Date(currentTime.getTime() + slotDurationMs);
			
			// Skip past dates
			if (slotEndTime <= new Date()) {
				currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000); // increment by 30 minutes
				continue;
			}
			
			// Check if slot conflicts with existing bookings
			const hasConflict = existingBookings.some(booking => 
				(currentTime < booking.endTime) && (slotEndTime > booking.startTime)
			);
			
			if (!hasConflict) {
				// For simplicity, assume available during business hours (9 AM - 6 PM)
				const hour = currentTime.getHours();
				if (hour >= 9 && hour < 18) {
					availableSlots.push({
						startTime: currentTime.toISOString(),
						endTime: slotEndTime.toISOString(),
						duration: duration
					});
				}
			}
			
			// Move to next slot (30-minute increments)
			currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
		}
		
		const response = {
			resourceId,
			startDate: startDateParam,
			endDate: endDateParam,
			duration,
			availableSlots,
			existingBookings: existingBookings.map(booking => ({
				startTime: booking.startTime.toISOString(),
				endTime: booking.endTime.toISOString()
			}))
		};
		
		return successResponse(response);
		
	} catch (error) {
		console.error('Error fetching availability:', error);
		return errorResponse(error instanceof Error ? error.message : 'Failed to fetch availability', 500);
	}
};
