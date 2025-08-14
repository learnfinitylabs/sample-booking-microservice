<script lang="ts">
	import { onMount } from 'svelte';
	
	interface Booking {
		id: string;
		title: string;
		resourceName: string;
		startTime: string;
		endTime: string;
		status: string;
		userDisplayName?: string;
	}
	
	interface Resource {
		id: string;
		name: string;
		category: string;
		capacity: number;
	}
	
	let apiKey = '';
	let bookings: Booking[] = [];
	let resources: Resource[] = [];
	let loading = false;
	let error = '';
	let success = '';
	
	// New booking form
	let newBooking = {
		resourceId: '',
		title: '',
		description: '',
		startTime: '',
		endTime: ''
	};
	
	onMount(() => {
		// Load API key from localStorage if available
		const savedApiKey = localStorage.getItem('booking-api-key');
		if (savedApiKey) {
			apiKey = savedApiKey;
			loadData();
		}
	});
	
	async function loadData() {
		if (!apiKey) {
			error = 'Please enter an API key';
			return;
		}
		
		loading = true;
		error = '';
		
		try {
			// Load resources
			const resourcesResponse = await fetch('/api/resources?api_key=' + apiKey);
			const resourcesData = await resourcesResponse.json();
			
			if (resourcesData.success) {
				resources = resourcesData.data;
			} else {
				throw new Error(resourcesData.error || 'Failed to load resources');
			}
			
			// Load bookings
			const bookingsResponse = await fetch('/api/calendar?api_key=' + apiKey);
			const bookingsData = await bookingsResponse.json();
			
			if (bookingsData.success) {
				bookings = bookingsData.data.bookings;
			} else {
				throw new Error(bookingsData.error || 'Failed to load bookings');
			}
			
			// Save API key to localStorage
			localStorage.setItem('booking-api-key', apiKey);
			success = 'Data loaded successfully';
			
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error occurred';
		} finally {
			loading = false;
		}
	}
	
	async function createBooking() {
		if (!apiKey || !newBooking.resourceId || !newBooking.title || !newBooking.startTime || !newBooking.endTime) {
			error = 'Please fill in all required fields';
			return;
		}
		
		loading = true;
		error = '';
		
		try {
			const response = await fetch('/api/bookings?api_key=' + apiKey, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(newBooking)
			});
			
			const data = await response.json();
			
			if (data.success) {
				success = 'Booking created successfully';
				newBooking = {
					resourceId: '',
					title: '',
					description: '',
					startTime: '',
					endTime: ''
				};
				await loadData(); // Reload data
			} else {
				throw new Error(data.error || 'Failed to create booking');
			}
			
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error occurred';
		} finally {
			loading = false;
		}
	}
	
	function formatDateTime(dateString: string): string {
		return new Date(dateString).toLocaleString();
	}
	
	function clearMessages() {
		error = '';
		success = '';
	}
</script>

<svelte:head>
	<title>Booking Microservice Demo</title>
</svelte:head>

<div class="container">
	<header>
		<div class="header-content">
			<div class="title-section">
				<h1>🗓️ Booking Microservice Demo</h1>
				<p>Multi-tenant headless booking system with SvelteKit & MySQL</p>
			</div>
			
			<!-- Navigation Links -->
			<nav class="navigation">
				<a href="/" class="nav-link active">API Demo</a>
				<a href="/calendar" class="nav-link">📅 Calendar UI</a>
			</nav>
		</div>
	</header>

	{#if error}
		<div class="alert error">
			{error}
			<button on:click={clearMessages}>×</button>
		</div>
	{/if}

	{#if success}
		<div class="alert success">
			{success}
			<button on:click={clearMessages}>×</button>
		</div>
	{/if}

	<section class="api-key-section">
		<h2>API Configuration</h2>
		<div class="form-group">
			<label for="apiKey">API Key:</label>
			<input 
				id="apiKey"
				type="text" 
				bind:value={apiKey} 
				placeholder="Enter your tenant API key"
				on:input={clearMessages}
			>
			<button on:click={loadData} disabled={loading || !apiKey}>
				{loading ? 'Loading...' : 'Load Data'}
			</button>
		</div>
	</section>

	{#if resources.length > 0}
		<section class="create-booking-section">
			<h2>Create New Booking</h2>
			<form on:submit|preventDefault={createBooking}>
				<div class="form-row">
					<div class="form-group">
						<label for="resource">Resource:</label>
						<select id="resource" bind:value={newBooking.resourceId} required>
							<option value="">Select a resource</option>
							{#each resources as resource}
								<option value={resource.id}>
									{resource.name} ({resource.category}) - Capacity: {resource.capacity}
								</option>
							{/each}
						</select>
					</div>
				</div>
				
				<div class="form-group">
					<label for="title">Title:</label>
					<input 
						id="title"
						type="text" 
						bind:value={newBooking.title} 
						placeholder="Booking title"
						required
					>
				</div>
				
				<div class="form-group">
					<label for="description">Description:</label>
					<textarea 
						id="description"
						bind:value={newBooking.description} 
						placeholder="Optional description"
					></textarea>
				</div>
				
				<div class="form-row">
					<div class="form-group">
						<label for="startTime">Start Time:</label>
						<input 
							id="startTime"
							type="datetime-local" 
							bind:value={newBooking.startTime} 
							required
						>
					</div>
					
					<div class="form-group">
						<label for="endTime">End Time:</label>
						<input 
							id="endTime"
							type="datetime-local" 
							bind:value={newBooking.endTime} 
							required
						>
					</div>
				</div>
				
				<button type="submit" disabled={loading}>
					{loading ? 'Creating...' : 'Create Booking'}
				</button>
			</form>
		</section>

		<section class="resources-section">
			<h2>Available Resources</h2>
			<div class="resources-grid">
				{#each resources as resource}
					<div class="resource-card">
						<h3>{resource.name}</h3>
						<p class="category">{resource.category}</p>
						<p class="capacity">Capacity: {resource.capacity}</p>
					</div>
				{/each}
			</div>
		</section>

		<section class="bookings-section">
			<h2>Current Bookings</h2>
			{#if bookings.length === 0}
				<p class="no-data">No bookings found</p>
			{:else}
				<div class="bookings-list">
					{#each bookings as booking}
						<div class="booking-card status-{booking.status}">
							<div class="booking-header">
								<h3>{booking.title}</h3>
								<span class="status">{booking.status}</span>
							</div>
							<div class="booking-details">
								<p><strong>Resource:</strong> {booking.resourceName}</p>
								<p><strong>Start:</strong> {formatDateTime(booking.startTime)}</p>
								<p><strong>End:</strong> {formatDateTime(booking.endTime)}</p>
								{#if booking.userDisplayName}
									<p><strong>User:</strong> {booking.userDisplayName}</p>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	{:else if apiKey}
		<div class="no-data">
			{loading ? 'Loading resources...' : 'No resources found. Make sure your API key is valid.'}
		</div>
	{/if}
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	header {
		margin-bottom: 3rem;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 2rem;
	}

	.title-section h1 {
		font-size: 2.5rem;
		color: #333;
		margin-bottom: 0.5rem;
	}

	.title-section p {
		font-size: 1.2rem;
		color: #666;
		margin: 0;
	}

	.navigation {
		display: flex;
		gap: 1rem;
	}

	.nav-link {
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 600;
		transition: all 0.2s;
		border: 2px solid transparent;
	}

	.nav-link.active {
		background: #007acc;
		color: white;
	}

	.nav-link:not(.active) {
		color: #666;
		border-color: #e1e5e9;
	}

	.nav-link:not(.active):hover {
		background: #f8f9fa;
		color: #333;
	}

	.alert {
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 2rem;
		position: relative;
	}

	.alert.error {
		background-color: #fee;
		border: 1px solid #fcc;
		color: #c33;
	}

	.alert.success {
		background-color: #efe;
		border: 1px solid #cfc;
		color: #3c3;
	}

	.alert button {
		position: absolute;
		top: 0.5rem;
		right: 1rem;
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: inherit;
	}

	section {
		margin-bottom: 3rem;
		padding: 2rem;
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
	}

	h2 {
		color: #333;
		margin-bottom: 1.5rem;
		font-size: 1.8rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #555;
	}

	input, select, textarea {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e1e5e9;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	input:focus, select:focus, textarea:focus {
		outline: none;
		border-color: #007acc;
	}

	textarea {
		resize: vertical;
		min-height: 100px;
	}

	button {
		background: #007acc;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	button:hover:not(:disabled) {
		background: #005a9e;
	}

	button:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.resources-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.resource-card {
		padding: 1.5rem;
		border: 2px solid #e1e5e9;
		border-radius: 8px;
		background: #f8f9fa;
	}

	.resource-card h3 {
		margin: 0 0 0.5rem 0;
		color: #333;
	}

	.category {
		background: #007acc;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.8rem;
		display: inline-block;
		margin-bottom: 0.5rem;
	}

	.capacity {
		color: #666;
		margin: 0;
	}

	.bookings-list {
		display: grid;
		gap: 1rem;
	}

	.booking-card {
		padding: 1.5rem;
		border: 2px solid #e1e5e9;
		border-radius: 8px;
		background: white;
	}

	.booking-card.status-confirmed {
		border-color: #28a745;
		background: #f8fff8;
	}

	.booking-card.status-pending {
		border-color: #ffc107;
		background: #fffef8;
	}

	.booking-card.status-cancelled {
		border-color: #dc3545;
		background: #fff8f8;
	}

	.booking-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.booking-header h3 {
		margin: 0;
		color: #333;
	}

	.status {
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.status-confirmed .status {
		background: #28a745;
		color: white;
	}

	.status-pending .status {
		background: #ffc107;
		color: #333;
	}

	.status-cancelled .status {
		background: #dc3545;
		color: white;
	}

	.booking-details p {
		margin: 0.5rem 0;
		color: #666;
	}

	.no-data {
		text-align: center;
		color: #999;
		font-style: italic;
		padding: 3rem;
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}
		
		.header-content {
			flex-direction: column;
			text-align: center;
		}
		
		.navigation {
			justify-content: center;
		}
		
		.form-row {
			grid-template-columns: 1fr;
		}
		
		.resources-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
