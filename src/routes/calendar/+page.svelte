<script lang="ts">
	import Calendar from '$lib/components/Calendar.svelte';
	import { onMount } from 'svelte';

	// Demo tenant configurations
	const tenants = [
		{
			name: 'Demo Office',
			apiKey: '61d98f73-6746-4700-b388-93bd9de72801.uydigcx8engdm4az6mjhc',
			description: 'Office spaces and meeting rooms'
		},
		{
			name: 'QuickFix Home Services',
			apiKey: 'be63b48e-6090-4724-b601-788d0100cd08.mmp728enuzhxy17fncpg4',
			description: 'Home service providers and appointments'
		}
	];

	let selectedTenant = tenants[1]; // Default to home services
	let selectedTenantIndex = 1; // Track the selected index
	let currentView: 'month' | 'week' | 'day' = 'month';
	let mounted = false;

	onMount(() => {
		mounted = true;
	});

	// Update selectedTenant when selectedTenantIndex changes
	$: selectedTenant = tenants[selectedTenantIndex];
</script>

<svelte:head>
	<title>Booking Calendar Demo - Multi-Tenant</title>
	<meta name="description" content="Demo calendar interface for the booking microservice" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center py-6">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Booking Calendar Demo</h1>
					<p class="mt-1 text-sm text-gray-600">Multi-tenant booking microservice</p>
				</div>
				
				<!-- Tenant Switcher -->
				<div class="flex items-center space-x-4">
					<label for="tenant-select" class="text-sm font-medium text-gray-700">
						Select Tenant:
					</label>
					<select
						id="tenant-select"
						class="block w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-white"
						bind:value={selectedTenantIndex}
					>
						{#each tenants as tenant, index}
							<option value={index}>
								{tenant.name} - {tenant.description}
							</option>
						{/each}
					</select>
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<!-- Tenant Info Card -->
		<div class="bg-white rounded-lg shadow p-6 mb-6">
			<div class="flex items-center justify-between">
				<div>
					<h2 class="text-xl font-semibold text-gray-900">{selectedTenant.name}</h2>
					<p class="text-gray-600">{selectedTenant.description}</p>
					<p class="text-sm text-gray-500 font-mono mt-1">API Key: {selectedTenant.apiKey.split('.')[0]}...</p>
				</div>
				
				<!-- Quick Stats or Actions -->
				<div class="flex items-center space-x-4">
					<div class="text-center">
						<div class="text-2xl font-bold text-blue-600">Live</div>
						<div class="text-sm text-gray-500">Calendar Data</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Calendar Component -->
		{#if mounted}
			{#key selectedTenant.apiKey}
				<Calendar 
					apiKey={selectedTenant.apiKey}
					view={currentView}
					currentDate={new Date()}
				/>
			{/key}
		{:else}
			<div class="bg-white rounded-lg shadow p-8">
				<div class="flex items-center justify-center">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
					<span class="ml-2 text-gray-600">Loading calendar...</span>
				</div>
			</div>
		{/if}

		<!-- Instructions -->
		<div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
			<h3 class="text-lg font-medium text-blue-900 mb-3">📅 Calendar Demo Instructions</h3>
			<div class="text-blue-800 space-y-2">
				<p><strong>Views Available:</strong> Switch between Month, Week, and Day views using the buttons in the calendar header.</p>
				<p><strong>Navigation:</strong> Use the arrow buttons to navigate between time periods, or click "Today" to jump to the current date.</p>
				<p><strong>Booking Details:</strong> Click on any colored booking to see detailed information in a modal popup.</p>
				<p><strong>Multi-Tenant:</strong> Switch between different tenants using the dropdown above to see their respective bookings and resources.</p>
				<p><strong>Live Data:</strong> The calendar loads real booking data from the microservice API in real-time.</p>
			</div>
		</div>

		<!-- Features Showcase -->
		<div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
			<div class="bg-white rounded-lg shadow p-6">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<svg class="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div class="ml-4">
						<h4 class="text-lg font-medium text-gray-900">Multi-Tenant</h4>
						<p class="text-sm text-gray-600">Complete tenant isolation with secure API keys</p>
					</div>
				</div>
			</div>

			<div class="bg-white rounded-lg shadow p-6">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<svg class="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
					</div>
					<div class="ml-4">
						<h4 class="text-lg font-medium text-gray-900">Flexible Views</h4>
						<p class="text-sm text-gray-600">Month, week, and day views with time details</p>
					</div>
				</div>
			</div>

			<div class="bg-white rounded-lg shadow p-6">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<svg class="h-8 w-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div class="ml-4">
						<h4 class="text-lg font-medium text-gray-900">Rich Details</h4>
						<p class="text-sm text-gray-600">Detailed booking information and metadata</p>
					</div>
				</div>
			</div>
		</div>
	</main>
</div>
