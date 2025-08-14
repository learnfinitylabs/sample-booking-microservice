<script lang="ts">
	import Calendar from '$lib/components/Calendar.svelte';
	import { onMount } from 'svelte';

	// Dynamic tenant configurations - loaded from API
	let tenants: Array<{
		name: string;
		apiKey: string;
		description?: string;
		domain?: string;
	}> = [];
	
	let selectedTenant: any = null;
	let selectedTenantIndex = 0;
	let currentView: 'month' | 'week' | 'day' = 'month';
	let mounted = false;
	let loading = true;
	let error: string | null = null;
	let calendarKey = 0; // Key to force Calendar refresh when needed
	let initialDate = new Date(); // Stable initial date reference

	// Fetch tenant configuration on mount
	onMount(async () => {
		await loadTenantConfig();
		mounted = true;
	});

	async function loadTenantConfig() {
		try {
			loading = true;
			error = null;
			
			// Try to load from database first
			const dbResponse = await fetch('/api/config/tenants/db');
			const dbData = await dbResponse.json();
			
			if (dbData.success && dbData.data.tenants.length > 0) {
				tenants = dbData.data.tenants.map((tenant: any) => ({
					name: tenant.name,
					apiKey: tenant.apiKey,
					description: getDefaultDescription(tenant.name),
					domain: tenant.domain
				}));
			} else {
				// Fallback to environment-based config
				const envResponse = await fetch('/api/config/tenants');
				const envData = await envResponse.json();
				
				if (envData.success) {
					tenants = envData.data.tenants.map((tenant: any) => ({
						name: tenant.name,
						apiKey: tenant.apiKey,
						description: getDefaultDescription(tenant.name)
					}));
				} else {
					throw new Error('Failed to load tenant configuration');
				}
			}
			
			// Set default selected tenant
			if (tenants.length > 0) {
				selectedTenantIndex = 0;
				selectedTenant = tenants[0];
			}
		} catch (err) {
			console.error('Error loading tenant config:', err);
			error = 'Failed to load tenant configuration. Please check your environment setup.';
		} finally {
			loading = false;
		}
	}

	function getDefaultDescription(name: string): string {
		if (name.toLowerCase().includes('office')) {
			return 'Office spaces and meeting rooms';
		} else if (name.toLowerCase().includes('home') || name.toLowerCase().includes('service')) {
			return 'Home service providers and appointments';
		} else {
			return 'Booking management system';
		}
	}

	// Update selectedTenant when selectedTenantIndex changes
	$: if (tenants.length > 0) {
		const newTenant = tenants[selectedTenantIndex];
		if (selectedTenant && selectedTenant.apiKey !== newTenant.apiKey) {
			// Only increment key if API key actually changed
			calendarKey++;
		}
		selectedTenant = newTenant;
	}
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
		{#if loading}
			<!-- Loading State -->
			<div class="bg-white rounded-lg shadow p-6 mb-6">
				<div class="animate-pulse">
					<div class="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
					<div class="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
					<div class="h-3 bg-gray-200 rounded w-3/4"></div>
				</div>
			</div>
			<div class="bg-white rounded-lg shadow p-6">
				<div class="animate-pulse">
					<div class="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
					<div class="grid grid-cols-7 gap-4">
						{#each Array(21) as _}
							<div class="h-16 bg-gray-200 rounded"></div>
						{/each}
					</div>
				</div>
			</div>
		{:else if error}
			<!-- Error State -->
			<div class="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
				<div class="flex items-center">
					<svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
					</svg>
					<h3 class="text-lg font-medium text-red-800">Configuration Error</h3>
				</div>
				<p class="mt-2 text-red-700">{error}</p>
				<button 
					class="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
					on:click={loadTenantConfig}
				>
					Retry
				</button>
			</div>
		{:else if tenants.length === 0}
			<!-- No Tenants State -->
			<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
				<div class="flex items-center">
					<svg class="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
					</svg>
					<h3 class="text-lg font-medium text-yellow-800">No Tenants Configured</h3>
				</div>
				<p class="mt-2 text-yellow-700">No tenant API keys found. Please configure environment variables or check database.</p>
			</div>
		{:else}
			<!-- Tenant Info Card -->
			<div class="bg-white rounded-lg shadow p-6 mb-6">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-xl font-semibold text-gray-900">{selectedTenant.name}</h2>
						<p class="text-gray-600">{selectedTenant.description}</p>
						<p class="text-sm text-gray-500 font-mono mt-1">API Key: {selectedTenant.apiKey.split('.')[0]}...</p>
						{#if selectedTenant.domain}
							<p class="text-sm text-gray-500 mt-1">Domain: {selectedTenant.domain}</p>
						{/if}
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
			{#if mounted && selectedTenant}
				{#key calendarKey}
					<Calendar 
						apiKey={selectedTenant.apiKey}
						view={currentView}
						currentDate={initialDate}
					/>
				{/key}
			{/if}
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
