import type { RequestHandler } from './$types.js';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	const apiDocs = {
		title: "Booking Microservice API",
		version: "1.0.0",
		description: "Multi-tenant headless booking system with SvelteKit & MySQL",
		baseUrl: "http://localhost:5173/api",
		authentication: {
			apiKey: {
				description: "Required for all endpoints",
				methods: [
					"Header: X-API-Key: your-tenant-api-key",
					"Query parameter: ?api_key=your-tenant-api-key"
				]
			},
			userToken: {
				description: "Optional for user-specific operations",
				method: "Header: Authorization: Bearer your-jwt-token"
			}
		},
		endpoints: {
			bookings: {
				"GET /api/bookings": {
					description: "List bookings with optional filters",
					query_parameters: {
						resource_id: "Filter by resource ID",
						user_id: "Filter by user ID (admin only)",
						status: "Filter by status (pending, confirmed, cancelled, completed)",
						start_date: "Filter bookings starting after this date (ISO 8601)",
						end_date: "Filter bookings ending before this date (ISO 8601)",
						limit: "Maximum number of results (default: no limit)",
						offset: "Number of results to skip (default: 0)"
					},
					response: "Array of booking objects"
				},
				"POST /api/bookings": {
					description: "Create a new booking",
					body: {
						resourceId: "string (required) - Resource UUID",
						title: "string (required) - Booking title",
						description: "string (optional) - Booking description",
						startTime: "string (required) - ISO 8601 datetime",
						endTime: "string (required) - ISO 8601 datetime",
						userId: "string (optional) - User UUID (auto-set if authenticated)",
						externalReference: "string (optional) - External system reference",
						metadata: "object (optional) - Custom data"
					},
					response: "Created booking object"
				},
				"GET /api/bookings/{id}": {
					description: "Get booking by ID",
					response: "Booking object"
				},
				"PUT /api/bookings/{id}": {
					description: "Update booking",
					body: {
						title: "string (optional) - Updated title",
						description: "string (optional) - Updated description",
						startTime: "string (optional) - Updated start time",
						endTime: "string (optional) - Updated end time",
						status: "string (optional) - Updated status",
						metadata: "object (optional) - Updated metadata"
					},
					response: "Updated booking object"
				},
				"DELETE /api/bookings/{id}": {
					description: "Cancel booking",
					response: "Success message"
				}
			},
			resources: {
				"GET /api/resources": {
					description: "List all resources for tenant",
					response: "Array of resource objects"
				},
				"GET /api/resources/{id}/availability": {
					description: "Check resource availability",
					query_parameters: {
						start_date: "string (required) - Start date (ISO 8601)",
						end_date: "string (required) - End date (ISO 8601)",
						duration: "number (optional) - Slot duration in minutes (default: 60)"
					},
					response: {
						resourceId: "Resource UUID",
						startDate: "Query start date",
						endDate: "Query end date",
						duration: "Slot duration in minutes",
						availableSlots: "Array of available time slots",
						existingBookings: "Array of existing bookings in the period"
					}
				}
			},
			calendar: {
				"GET /api/calendar": {
					description: "Get calendar view of bookings",
					query_parameters: {
						month: "string (optional) - Month in YYYY-MM format (default: current month)",
						resource_id: "string (optional) - Filter by resource",
						view: "string (optional) - View type: month, week, day (default: month)"
					},
					response: {
						period: "Time period information",
						bookings: "Array of bookings in the period",
						resources: "Array of available resources",
						calendarDays: "Calendar grid (month view only)",
						summary: "Booking statistics"
					}
				}
			}
		},
		examples: {
			createBooking: {
				method: "POST",
				url: "/api/bookings?api_key=tenant123.abcdef...",
				headers: {
					"Content-Type": "application/json"
				},
				body: {
					resourceId: "550e8400-e29b-41d4-a716-446655440000",
					title: "Team Meeting",
					description: "Weekly team standup",
					startTime: "2024-08-15T09:00:00Z",
					endTime: "2024-08-15T10:00:00Z"
				}
			},
			checkAvailability: {
				method: "GET",
				url: "/api/resources/550e8400-e29b-41d4-a716-446655440000/availability?start_date=2024-08-15&end_date=2024-08-16&duration=60&api_key=tenant123.abcdef..."
			},
			getCalendar: {
				method: "GET",
				url: "/api/calendar?month=2024-08&api_key=tenant123.abcdef..."
			}
		},
		responseFormat: {
			success: {
				success: true,
				data: "Response data",
				message: "Optional success message"
			},
			error: {
				success: false,
				error: "Error message",
				message: "Optional additional context"
			}
		},
		statusCodes: {
			200: "Success",
			400: "Bad Request - Invalid input",
			401: "Unauthorized - Missing or invalid API key",
			403: "Forbidden - Access denied",
			404: "Not Found - Resource not found",
			409: "Conflict - Booking conflict detected",
			500: "Internal Server Error"
		}
	};
	
	return json(apiDocs);
};
