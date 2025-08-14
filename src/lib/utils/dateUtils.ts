// Date utility functions for the calendar
export function formatDate(date: Date, format: string): string {
	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const day = date.getDate();
	const hours = date.getHours();
	const minutes = date.getMinutes();

	const pad = (num: number): string => num.toString().padStart(2, '0');

	switch (format) {
		case 'YYYY-MM':
			return `${year}-${pad(month)}`;
		case 'YYYY-MM-DD':
			return `${year}-${pad(month)}-${pad(day)}`;
		case 'MMM D':
			return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		case 'MMM D, YYYY':
			return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
		case 'h:mm A':
			return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
		default:
			return date.toString();
	}
}

export function formatTime(date: Date): string {
	return date.toLocaleTimeString('en-US', { 
		hour: 'numeric', 
		minute: '2-digit', 
		hour12: true 
	});
}

export function isToday(date: Date): boolean {
	const today = new Date();
	return isSameDay(date, today);
}

export function isSameDay(date1: Date, date2: Date): boolean {
	return date1.getFullYear() === date2.getFullYear() &&
		   date1.getMonth() === date2.getMonth() &&
		   date1.getDate() === date2.getDate();
}

export function getWeekStart(date: Date): Date {
	const start = new Date(date);
	const day = start.getDay();
	const diff = start.getDate() - day;
	start.setDate(diff);
	start.setHours(0, 0, 0, 0);
	return start;
}

export function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

export function addHours(date: Date, hours: number): Date {
	const result = new Date(date);
	result.setHours(result.getHours() + hours);
	return result;
}

export function getTimeSlots(): string[] {
	const slots: string[] = [];
	for (let hour = 0; hour < 24; hour++) {
		// Add the hour slot (e.g., "8:00 AM")
		const hourDate = new Date();
		hourDate.setHours(hour, 0, 0, 0);
		slots.push(formatTime(hourDate));
		
		// Add the half-hour slot (e.g., "8:30 AM")
		const halfHourDate = new Date();
		halfHourDate.setHours(hour, 30, 0, 0);
		slots.push(formatTime(halfHourDate));
	}
	return slots;
}

export function getTimeSlotIndex(date: Date): number {
	const hours = date.getHours();
	const minutes = date.getMinutes();
	// Each hour has 2 slots (0 min and 30 min), so multiply by 2 and add 1 if >= 30 minutes
	return (hours * 2) + (minutes >= 30 ? 1 : 0);
}
