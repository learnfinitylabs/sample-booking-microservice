import type { RequestHandler } from './$types.js';
import { BookingService } from '$lib/server/booking-service.js';
import { requireTenant, optionalUser, errorResponse, successResponse } from '$lib/server/middleware.js';
import type { CreateBookingRequest, BookingQuery } from '$lib/types.js';

const bookingService = new BookingService();

// GET /api/bookings - List bookings
export const GET: RequestHandler = async (event) => {
	try {
		const tenant = await requireTenant(event);
		const user = await optionalUser(event, tenant);
		
		// Parse query parameters
		const url = new URL(event.request.url);
		const query: BookingQuery = {
			resourceId: url.searchParams.get('resource_id') || undefined,
			userId: url.searchParams.get('user_id') || undefined,
			status: url.searchParams.get('status') || undefined,
			startDate: url.searchParams.get('start_date') || undefined,
			endDate: url.searchParams.get('end_date') || undefined,
			limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
			offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : undefined
		};
		
		// If user is provided and not admin, filter by their bookings only
		if (user && user.role !== 'admin') {
			query.userId = user.id;
		}
		
		const bookings = await bookingService.getBookings(tenant.id, query);
		
		return successResponse(bookings);
		
	} catch (error) {
		console.error('Error fetching bookings:', error);
		return errorResponse(error instanceof Error ? error.message : 'Failed to fetch bookings', 500);
	}
};

// POST /api/bookings - Create new booking
export const POST: RequestHandler = async (event) => {
	try {
		const tenant = await requireTenant(event);
		const user = await optionalUser(event, tenant);
		
		const requestBody: CreateBookingRequest = await event.request.json();
		
		// Validate required fields
		if (!requestBody.resourceId || !requestBody.title || !requestBody.startTime || !requestBody.endTime) {
			return errorResponse('Missing required fields: resourceId, title, startTime, endTime');
		}
		
		// Validate date format
		const startTime = new Date(requestBody.startTime);
		const endTime = new Date(requestBody.endTime);
		
		if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
			return errorResponse('Invalid date format. Use ISO 8601 format.');
		}
		
		if (startTime >= endTime) {
			return errorResponse('Start time must be before end time');
		}
		
		// If user is authenticated, set userId automatically
		if (user && !requestBody.userId) {
			requestBody.userId = user.id;
		}
		
		const booking = await bookingService.createBooking(tenant.id, requestBody);
		
		return successResponse(booking, 'Booking created successfully');
		
	} catch (error) {
		console.error('Error creating booking:', error);
		return errorResponse(error instanceof Error ? error.message : 'Failed to create booking', 500);
	}
};
