<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import type { Booking, Resource } from '$lib/types.js';
	import BookingModal from './BookingModal.svelte';
	import { formatDate, formatTime, isToday, isSameDay, getWeekStart, addDays, getTimeSlots, getTimeSlotIndex } from '$lib/utils/dateUtils.js';

	export let apiKey: string;
	export let view: 'month' | 'week' | 'day' = 'month';
	export let currentDate: Date = new Date();

	// Store state
	const bookings = writable<Booking[]>([]);
	const resources = writable<Resource[]>([]);
	const loading = writable(false);
	const error = writable<string | null>(null);
	const displayDate = writable(new Date(currentDate));

	// Modal state
	let selectedBooking: Booking | null = null;
	let showModal = false;

	onMount(() => {
		// Don't call loadCalendarData here - let the reactive statement handle it
	});

	// Watch for apiKey changes and reload data
	$: {
		if (apiKey) {
			loadCalendarData();
		}
	}

	async function loadCalendarData() {
		loading.set(true);
		error.set(null);

		try {
			const currentDisplayDate = $displayDate;
			const month = formatDate(currentDisplayDate, 'YYYY-MM');
			const response = await fetch(`/api/calendar?month=${month}`, {
				headers: {
					'X-API-Key': apiKey
				}
			});
			const data = await response.json();

			if (data.success) {
				bookings.set(data.data.bookings || []);
				resources.set(data.data.resources || []);
			} else {
				error.set(data.error || 'Failed to load calendar data');
			}
		} catch (err) {
			error.set('Network error loading calendar');
			console.error('Calendar load error:', err);
		} finally {
			loading.set(false);
		}
	}

	// Navigation functions
	function navigatePrevious() {
		const currentDisplayDate = $displayDate;
		switch (view) {
			case 'month':
				displayDate.set(new Date(currentDisplayDate.getFullYear(), currentDisplayDate.getMonth() - 1, currentDisplayDate.getDate()));
				break;
			case 'week':
				displayDate.set(new Date(currentDisplayDate.getTime() - (7 * 24 * 60 * 60 * 1000)));
				break;
			case 'day':
				displayDate.set(new Date(currentDisplayDate.getTime() - (24 * 60 * 60 * 1000)));
				break;
		}
		loadCalendarData();
	}

	function navigateNext() {
		const currentDisplayDate = $displayDate;
		switch (view) {
			case 'month':
				displayDate.set(new Date(currentDisplayDate.getFullYear(), currentDisplayDate.getMonth() + 1, currentDisplayDate.getDate()));
				break;
			case 'week':
				displayDate.set(new Date(currentDisplayDate.getTime() + (7 * 24 * 60 * 60 * 1000)));
				break;
			case 'day':
				displayDate.set(new Date(currentDisplayDate.getTime() + (24 * 60 * 60 * 1000)));
				break;
		}
		loadCalendarData();
	}

	function goToToday() {
		displayDate.set(new Date());
		loadCalendarData();
	}

	function openBookingModal(booking: Booking) {
		selectedBooking = booking;
		showModal = true;
		document.body.classList.add('modal-open');
	}

	function closeModal() {
		showModal = false;
		selectedBooking = null;
		document.body.classList.remove('modal-open');
	}

	// Helper functions for calendar rendering
	function getBookingsForDate(date: Date): Booking[] {
		return $bookings.filter(booking => {
			const bookingDate = new Date(booking.startTime);
			return isSameDay(bookingDate, date);
		});
	}

	function getBookingsForTimeSlot(date: Date, slotIndex: number): Booking[] {
		return $bookings.filter(booking => {
			const bookingStart = new Date(booking.startTime);
			const bookingEnd = new Date(booking.endTime);
			
			// Calculate the start and end time for this 30-minute slot
			const slotHour = Math.floor(slotIndex / 2);
			const slotMinutes = (slotIndex % 2) * 30;
			
			const slotStart = new Date(date);
			slotStart.setHours(slotHour, slotMinutes, 0, 0);
			const slotEnd = new Date(date);
			slotEnd.setHours(slotHour, slotMinutes + 30, 0, 0);

			return (bookingStart < slotEnd && bookingEnd > slotStart) && isSameDay(bookingStart, date);
		});
	}

	function getViewTitle(): string {
		const currentDisplayDate = $displayDate;
		switch (view) {
			case 'month':
				return currentDisplayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
			case 'week':
				const weekStart = getWeekStart(currentDisplayDate);
				const weekEnd = addDays(weekStart, 6);
				return `${formatDate(weekStart, 'MMM D')} - ${formatDate(weekEnd, 'MMM D, YYYY')}`;
			case 'day':
				return currentDisplayDate.toLocaleDateString('en-US', { 
					weekday: 'long', 
					month: 'long', 
					day: 'numeric', 
					year: 'numeric' 
				});
		}
	}

	function getMonthDays(): Date[] {
		const currentDisplayDate = $displayDate;
		const firstDay = new Date(currentDisplayDate.getFullYear(), currentDisplayDate.getMonth(), 1);
		const startDate = getWeekStart(firstDay);
		
		const days: Date[] = [];
		const current = new Date(startDate);
		
		// Generate 6 weeks worth of days
		for (let i = 0; i < 42; i++) {
			days.push(new Date(current));
			current.setDate(current.getDate() + 1);
		}
		
		return days;
	}

	function getWeekDays(): Date[] {
		const currentDisplayDate = $displayDate;
		const weekStart = getWeekStart(currentDisplayDate);
		const days: Date[] = [];
		
		for (let i = 0; i < 7; i++) {
			days.push(addDays(weekStart, i));
		}
		
		return days;
	}

	function isCurrentMonth(date: Date): boolean {
		const currentDisplayDate = $displayDate;
		return date.getMonth() === currentDisplayDate.getMonth();
	}

	function getBookingColor(booking: Booking): string {
		switch (booking.status) {
			case 'confirmed':
				return 'booking-confirmed';
			case 'pending':
				return 'booking-pending';
			case 'cancelled':
				return 'booking-cancelled';
			default:
				return 'booking-confirmed';
		}
	}

	function getBookingPosition(booking: Booking, slotIndex: number): { top: string; height: string } {
		const start = new Date(booking.startTime);
		const end = new Date(booking.endTime);
		
		// Calculate the slot start time
		const slotHour = Math.floor(slotIndex / 2);
		const slotMinutes = (slotIndex % 2) * 30;
		
		// Calculate position within the 30-minute slot
		const slotStartMinutes = slotHour * 60 + slotMinutes;
		const bookingStartMinutes = start.getHours() * 60 + start.getMinutes();
		const bookingEndMinutes = end.getHours() * 60 + end.getMinutes();
		
		// Position relative to the slot (30 minutes = 100%)
		const minutesFromSlotStart = Math.max(0, bookingStartMinutes - slotStartMinutes);
		const durationMinutes = bookingEndMinutes - Math.max(bookingStartMinutes, slotStartMinutes);
		
		const top = (minutesFromSlotStart / 30) * 100;
		const height = Math.max((durationMinutes / 30) * 100, 10); // Minimum 10% height
		
		return {
			top: `${Math.min(top, 90)}%`, // Cap at 90% to ensure visibility
			height: `${Math.min(height, 100 - top)}%`
		};
	}

	// Check if two bookings overlap in time
	function bookingsOverlap(booking1: Booking, booking2: Booking): boolean {
		const start1 = new Date(booking1.startTime);
		const end1 = new Date(booking1.endTime);
		const start2 = new Date(booking2.startTime);
		const end2 = new Date(booking2.endTime);
		
		return start1 < end2 && start2 < end1;
	}

	// Calculate layout positions for overlapping bookings
	function calculateBookingLayout(bookings: Booking[], date: Date) {
		if (bookings.length === 0) return [];
		
		// Sort bookings by start time
		const sortedBookings = [...bookings].sort((a, b) => 
			new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
		);
		
		const layout = [];
		const columns = [];
		
		for (const booking of sortedBookings) {
			// Find the first column where this booking doesn't overlap with existing bookings
			let columnIndex = 0;
			let placed = false;
			
			for (let i = 0; i < columns.length; i++) {
				const column = columns[i];
				const hasOverlap = column.some(existingBooking => bookingsOverlap(booking, existingBooking));
				
				if (!hasOverlap) {
					columns[i].push(booking);
					columnIndex = i;
					placed = true;
					break;
				}
			}
			
			// If no existing column works, create a new one
			if (!placed) {
				columns.push([booking]);
				columnIndex = columns.length - 1;
			}
			
			layout.push({
				...booking,
				layoutColumn: columnIndex,
				layoutWidth: columns.length
			});
		}
		
		// Update width for all bookings based on total columns
		const totalColumns = columns.length;
		return layout.map(booking => ({
			...booking,
			layoutWidth: totalColumns
		}));
	}

	function getBookingLayoutStyle(booking, slotIndex) {
		const position = getBookingPosition(booking, slotIndex);
		const widthPercent = 100 / booking.layoutWidth;
		const leftPercent = (booking.layoutColumn * widthPercent);
		
		return `top: ${position.top}; height: ${position.height}; left: ${leftPercent}%; width: ${widthPercent - 1}%;`;
	}

	$: timeSlots = getTimeSlots();
	// Make viewTitle explicitly reactive to both displayDate and view
	$: viewTitle = $displayDate && view ? (() => {
		switch (view) {
			case 'month':
				return $displayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
			case 'week':
				const weekStart = getWeekStart($displayDate);
				const weekEnd = addDays(weekStart, 6);
				return `${formatDate(weekStart, 'MMM D')} - ${formatDate(weekEnd, 'MMM D, YYYY')}`;
			case 'day':
				return $displayDate.toLocaleDateString('en-US', { 
					weekday: 'long', 
					month: 'long', 
					day: 'numeric', 
					year: 'numeric' 
				});
			default:
				return '';
		}
	})() : '';
</script>

<div class="calendar-container">
	<!-- Header -->
	<div class="calendar-header">
		<div class="flex items-center space-x-4">
			<h1 class="text-xl font-semibold text-gray-900">{viewTitle}</h1>
			
			<!-- View switcher -->
			<div class="view-switcher">
				<button
					type="button"
					class="view-button {view === 'month' ? 'active' : 'inactive'}"
					on:click={() => view = 'month'}
				>
					Month
				</button>
				<button
					type="button"
					class="view-button {view === 'week' ? 'active' : 'inactive'}"
					on:click={() => view = 'week'}
				>
					Week
				</button>
				<button
					type="button"
					class="view-button {view === 'day' ? 'active' : 'inactive'}"
					on:click={() => view = 'day'}
				>
					Day
				</button>
			</div>
		</div>

		<!-- Navigation -->
		<div class="flex items-center space-x-2">
			<button
				type="button"
				class="nav-button"
				on:click={navigatePrevious}
				aria-label="Previous"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
			</button>
			
			<button
				type="button"
				class="today-button"
				on:click={goToToday}
			>
				Today
			</button>
			
			<button
				type="button"
				class="nav-button"
				on:click={navigateNext}
				aria-label="Next"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>
	</div>

	<!-- Loading state -->
	{#if $loading}
		<div class="flex items-center justify-center p-8">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<span class="ml-2 text-gray-600">Loading calendar...</span>
		</div>
	{:else if $error}
		<div class="p-4 bg-red-50 border border-red-200 rounded-md m-4">
			<div class="flex">
				<svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-red-800">Error loading calendar</h3>
					<div class="mt-2 text-sm text-red-700">{$error}</div>
				</div>
			</div>
		</div>
	{:else}
		<!-- Calendar content -->
		<div class="p-4">
			{#if view === 'month'}
				<!-- Month view -->
				<div class="month-grid">
					<!-- Day headers -->
					{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as dayName}
						<div class="day-header">
							{dayName}
						</div>
					{/each}
					
					<!-- Calendar days -->
					{#each getMonthDays() as day}
						<div class="calendar-day {isCurrentMonth(day) ? '' : 'other-month'} {isToday(day) ? 'today' : ''}">
							<div class="flex items-center justify-between mb-1">
								<span class="text-sm font-medium {isCurrentMonth(day) ? 'text-gray-900' : 'text-gray-400'} {isToday(day) ? 'text-blue-600 font-bold' : ''}">
									{day.getDate()}
								</span>
							</div>
							
							<!-- Bookings for this day -->
							<div class="space-y-1">
								{#each getBookingsForDate(day) as booking}
									<button
										type="button"
										class="booking-block {getBookingColor(booking)}"
										on:click={() => openBookingModal(booking)}
									>
										<div class="truncate font-medium">{booking.title}</div>
										<div class="truncate opacity-90 text-xs">{formatTime(new Date(booking.startTime))}</div>
									</button>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{:else if view === 'week'}
				<!-- Week view -->
				<div class="flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
					<!-- Week header -->
					<div class="grid grid-cols-8 gap-0 bg-gray-50 border-b border-gray-200">
						<div class="px-3 py-3 text-sm font-medium text-gray-500"></div>
						{#each getWeekDays() as day}
							<div class="px-3 py-3 text-center border-l border-gray-200">
								<div class="text-sm font-medium text-gray-700">
									{day.toLocaleDateString('en-US', { weekday: 'short' })}
								</div>
								<div class="text-lg font-semibold {isToday(day) ? 'text-blue-600' : 'text-gray-900'}">
									{day.getDate()}
								</div>
							</div>
						{/each}
					</div>
					
					<!-- Time slots -->
					<div class="max-h-96 overflow-y-auto">
						{#each timeSlots as timeSlot, slotIndex}
							<div class="grid grid-cols-8 gap-0 border-b border-gray-100 last:border-b-0">
								<div class="time-label">
									{timeSlot}
								</div>
								{#each getWeekDays() as day}
									{@const dayBookings = getBookingsForTimeSlot(day, slotIndex)}
									{@const layoutBookings = calculateBookingLayout(dayBookings, day)}
									<div class="time-content border-l border-gray-100 relative">
										{#each layoutBookings as booking}
											<button
												type="button"
												class="absolute px-2 py-1 text-xs rounded font-medium text-white transition-opacity hover:opacity-80 z-10 {getBookingColor(booking)}"
												style="{getBookingLayoutStyle(booking, slotIndex)} min-height: 20px;"
												on:click={() => openBookingModal(booking)}
											>
												<div class="truncate">{booking.title}</div>
											</button>
										{/each}
									</div>
								{/each}
							</div>
						{/each}
					</div>
				</div>
			{:else if view === 'day'}
				<!-- Day view -->
				<div class="flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
					<!-- Day header -->
					<div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
						<h2 class="text-lg font-semibold text-gray-900">
							{$displayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
						</h2>
					</div>
					
					<!-- Time slots -->
					<div class="max-h-96 overflow-y-auto">
						{#each timeSlots as timeSlot, slotIndex}
							{@const dayBookings = getBookingsForTimeSlot($displayDate, slotIndex)}
							{@const layoutBookings = calculateBookingLayout(dayBookings, $displayDate)}
							<div class="time-slot flex">
								<div class="time-label">
									{timeSlot}
								</div>
								<div class="time-content relative">
									{#each layoutBookings as booking}
										<button
											type="button"
											class="absolute px-3 py-2 text-sm rounded font-medium text-white transition-opacity hover:opacity-80 {getBookingColor(booking)}"
											style="{getBookingLayoutStyle(booking, slotIndex)} min-height: 30px; margin-left: 0.5rem; margin-right: 0.5rem;"
											on:click={() => openBookingModal(booking)}
										>
											<div class="font-semibold">{booking.title}</div>
											<div class="text-xs opacity-90">{booking.resourceName}</div>
										</button>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Booking Modal -->
<BookingModal 
	booking={selectedBooking} 
	isOpen={showModal} 
	onClose={closeModal} 
/>

<style>
	:global(body.modal-open) {
		overflow: hidden;
	}
</style>
