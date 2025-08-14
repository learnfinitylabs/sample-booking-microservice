import type { RequestHandler } from './$types.js';
import { BookingService } from '$lib/server/booking-service.js';
import { requireTenant, optionalUser, errorResponse, successResponse } from '$lib/server/middleware.js';
import type { UpdateBookingRequest } from '$lib/types.js';

const bookingService = new BookingService();

// GET /api/bookings/[id] - Get booking by ID
export const GET: RequestHandler = async (event) => {
	try {
		const tenant = await requireTenant(event);
		const user = await optionalUser(event, tenant);
		const bookingId = event.params.id;
		
		if (!bookingId) {
			return errorResponse('Booking ID is required');
		}
		
		const booking = await bookingService.getBookingById(tenant.id, bookingId);
		
		// If user is not admin, they can only see their own bookings
		if (user && user.role !== 'admin' && booking.userId !== user.id) {
			return errorResponse('Access denied', 403);
		}
		
		return successResponse(booking);
		
	} catch (error) {
		console.error('Error fetching booking:', error);
		return errorResponse(error instanceof Error ? error.message : 'Booking not found', 404);
	}
};

// PUT /api/bookings/[id] - Update booking
export const PUT: RequestHandler = async (event) => {
	try {
		const tenant = await requireTenant(event);
		const user = await optionalUser(event, tenant);
		const bookingId = event.params.id;
		
		if (!bookingId) {
			return errorResponse('Booking ID is required');
		}
		
		// Check if booking exists and user has access
		const existingBooking = await bookingService.getBookingById(tenant.id, bookingId);
		
		if (user && user.role !== 'admin' && existingBooking.userId !== user.id) {
			return errorResponse('Access denied', 403);
		}
		
		const requestBody: UpdateBookingRequest = await event.request.json();
		
		// Validate dates if provided
		if (requestBody.startTime) {
			const startTime = new Date(requestBody.startTime);
			if (isNaN(startTime.getTime())) {
				return errorResponse('Invalid start time format. Use ISO 8601 format.');
			}
		}
		
		if (requestBody.endTime) {
			const endTime = new Date(requestBody.endTime);
			if (isNaN(endTime.getTime())) {
				return errorResponse('Invalid end time format. Use ISO 8601 format.');
			}
		}
		
		if (requestBody.startTime && requestBody.endTime) {
			const startTime = new Date(requestBody.startTime);
			const endTime = new Date(requestBody.endTime);
			if (startTime >= endTime) {
				return errorResponse('Start time must be before end time');
			}
		}
		
		const updatedBooking = await bookingService.updateBooking(
			tenant.id, 
			bookingId, 
			requestBody, 
			user?.id
		);
		
		return successResponse(updatedBooking, 'Booking updated successfully');
		
	} catch (error) {
		console.error('Error updating booking:', error);
		return errorResponse(error instanceof Error ? error.message : 'Failed to update booking', 500);
	}
};

// DELETE /api/bookings/[id] - Cancel booking
export const DELETE: RequestHandler = async (event) => {
	try {
		const tenant = await requireTenant(event);
		const user = await optionalUser(event, tenant);
		const bookingId = event.params.id;
		
		if (!bookingId) {
			return errorResponse('Booking ID is required');
		}
		
		// Check if booking exists and user has access
		const existingBooking = await bookingService.getBookingById(tenant.id, bookingId);
		
		if (user && user.role !== 'admin' && existingBooking.userId !== user.id) {
			return errorResponse('Access denied', 403);
		}
		
		await bookingService.deleteBooking(tenant.id, bookingId, user?.id);
		
		return successResponse(null, 'Booking cancelled successfully');
		
	} catch (error) {
		console.error('Error cancelling booking:', error);
		return errorResponse(error instanceof Error ? error.message : 'Failed to cancel booking', 500);
	}
};
