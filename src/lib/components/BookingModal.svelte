<script lang="ts">
	import type { Booking } from '$lib/types.js';
	import { formatTime, formatDate } from '$lib/utils/dateUtils.js';

	export let booking: Booking | null = null;
	export let isOpen = false;
	export let onClose: () => void;

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'confirmed':
				return 'bg-green-100 text-green-800';
			case 'pending':
				return 'bg-yellow-100 text-yellow-800';
			case 'cancelled':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function formatDuration(startTime: string, endTime: string): string {
		const start = new Date(startTime);
		const end = new Date(endTime);
		const diffMs = end.getTime() - start.getTime();
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
		
		if (diffHours > 0) {
			return diffMinutes > 0 ? `${diffHours}h ${diffMinutes}m` : `${diffHours}h`;
		}
		return `${diffMinutes}m`;
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen && booking}
	<!-- Modal backdrop -->
	<div
		class="modal-backdrop"
		on:click={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
	>
		<!-- Modal content -->
		<div class="modal-content">
			<!-- Header -->
			<div class="border-b border-gray-200 px-6 py-4">
				<div class="flex items-center justify-between">
					<h2 id="modal-title" class="text-lg font-semibold text-gray-900">
						{booking.title}
					</h2>				<button
					type="button"
					class="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
					on:click={onClose}
					aria-label="Close modal"
				>
					<svg class="close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
				</div>
			</div>
		<!-- Body -->
		<div class="px-6 py-4 space-y-4 max-h-96 overflow-y-auto">
			<!-- Status and Resource -->
			<div class="flex items-center gap-3">
				<span class="inline-flex px-2.5 py-1 text-xs font-medium rounded-full {getStatusColor(booking.status)}">
					{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
				</span>
				<span class="text-sm text-gray-600">
					Resource: <span class="font-medium text-gray-900">{booking.resourceName || 'Unknown'}</span>
				</span>
			</div>			<!-- Date and Time -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-3">				<h3 class="text-sm font-medium text-gray-900 flex items-center gap-2">
					<svg class="section-icon text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
					Date & Time
				</h3>
					<div class="text-sm text-gray-600 space-y-1.5 ml-6">
						<div class="font-medium text-gray-900">
							{formatDate(new Date(booking.startTime), 'MMM D, YYYY')}
						</div>					<div class="flex items-center gap-2">
						<svg class="time-icon text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						{formatTime(new Date(booking.startTime))} - {formatTime(new Date(booking.endTime))}
						<span class="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
							{formatDuration(booking.startTime, booking.endTime)}
						</span>
					</div>
					</div>
				</div>

				{#if booking.userDisplayName}
					<div class="space-y-3">					<h3 class="text-sm font-medium text-gray-900 flex items-center gap-2">
						<svg class="section-icon text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
						</svg>
						Booked by
					</h3>
						<div class="text-sm font-medium text-gray-900 ml-6">
							{booking.userDisplayName}
						</div>
					</div>
				{/if}
			</div>			<!-- Description -->
			{#if booking.description}
				<div class="space-y-3">				<h3 class="text-sm font-medium text-gray-900 flex items-center gap-2">
					<svg class="section-icon text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
					Description
				</h3>
					<p class="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 ml-6">
						{booking.description}
					</p>
				</div>
			{/if}			<!-- External Reference -->
			{#if booking.externalReference}
				<div class="space-y-3">				<h3 class="text-sm font-medium text-gray-900 flex items-center gap-2">
					<svg class="section-icon text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-8 6v2m4-2v2m4-2v2M5 8h14l-1 9H6L5 8z" />
					</svg>
					Reference ID
				</h3>
					<p class="text-sm text-gray-600 font-mono bg-gray-50 rounded-lg p-2 ml-6 break-all">
						{booking.externalReference}
					</p>
				</div>
			{/if}			<!-- Metadata -->
			{#if booking.metadata && Object.keys(booking.metadata).length > 0}
				<div class="space-y-3">				<h3 class="text-sm font-medium text-gray-900 flex items-center gap-2">
					<svg class="section-icon text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					Additional Details
				</h3>				<div class="bg-gray-50 rounded-lg p-3 ml-6 space-y-1">
					{#each Object.entries(booking.metadata) as [key, value]}
						<div class="metadata-item">
							<span class="metadata-key">
								{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
							</span>
							<span class="metadata-value">
								{#if Array.isArray(value)}
									{value.join(', ')}
								{:else if typeof value === 'object'}
									{JSON.stringify(value)}
								{:else}
									{value}
								{/if}
							</span>
						</div>
					{/each}
				</div>
				</div>
			{/if}			<!-- Resource Category -->
			{#if booking.resourceCategory}
				<div class="space-y-3">				<h3 class="text-sm font-medium text-gray-900 flex items-center gap-2">
					<svg class="section-icon text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
					</svg>
					Category
				</h3>
					<span class="inline-flex px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full ml-6">
						{booking.resourceCategory}
					</span>
				</div>
			{/if}
			</div>
		<!-- Footer -->
		<div class="border-t border-gray-200 px-6 py-4 bg-gray-50">
			<div class="flex justify-end">
				<button
					type="button"
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
					on:click={onClose}
				>
					Close
				</button>
			</div>
		</div>
		</div>
	</div>
{/if}

<style>
	/* Ensure modal is above everything */
	:global(body.modal-open) {
		overflow: hidden;
	}

	/* Custom icon sizing for better visual hierarchy */
	.modal-content .close-icon {
		width: 20px;
		height: 20px;
	}

	.modal-content .section-icon {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}

	.modal-content .time-icon {
		width: 14px;
		height: 14px;
		flex-shrink: 0;
	}

	/* Improved modal styling */
	.modal-backdrop {
		backdrop-filter: blur(4px);
		animation: fadeIn 0.2s ease-out;
	}

	.modal-content {
		animation: slideUp 0.3s ease-out;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes slideUp {
		from { 
			opacity: 0;
			transform: translateY(1rem) scale(0.95);
		}
		to { 
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	/* Better spacing for metadata items */
	.metadata-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		padding: 0.5rem 0;
	}

	.metadata-key {
		font-weight: 500;
		color: #374151;
		flex-shrink: 0;
		min-width: 120px;
	}

	.metadata-value {
		color: #6B7280;
		text-align: right;
		word-break: break-word;
	}
</style>
