import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const DB_CONFIG = {
	host: process.env.DB_HOST || 'localhost',
	port: parseInt(process.env.DB_PORT || '3306'),
	user: process.env.DB_USER || 'booking_user',
	password: process.env.DB_PASSWORD || 'booking_pass',
	database: process.env.DB_NAME || 'booking_microservice'
};

function generateApiKey(tenantId) {
	const randomString = Math.random().toString(36).substring(2, 15) + 
					   Math.random().toString(36).substring(2, 15);
	return `${tenantId}.${randomString}`;
}

async function seedHomeServices() {
	console.log('Starting home services tenant seeding...');
	
	try {
		const connection = await mysql.createConnection(DB_CONFIG);
		
		// Check for existing tenant first
		const [existingRows] = await connection.execute(
			"SELECT id, api_key FROM tenants WHERE domain = 'quickfix.example.com'"
		);
		
		let tenantId, apiKey;
		
		if (Array.isArray(existingRows) && existingRows.length > 0) {
			// Use existing tenant
			tenantId = existingRows[0].id;
			apiKey = existingRows[0].api_key;
			console.log('Using existing QuickFix Home Services tenant...');
			console.log(`Tenant ID: ${tenantId}`);
		} else {
			// Create new tenant
			tenantId = uuidv4();
			apiKey = generateApiKey(tenantId);
			
			console.log('Creating home services tenant...');
			await connection.execute(
				`INSERT INTO tenants (id, name, domain, api_key, settings, created_at, updated_at) 
				 VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
				[
					tenantId,
					'QuickFix Home Services',
					'quickfix.example.com',
					apiKey,
					JSON.stringify({
						timezone: 'America/New_York',
						businessHours: {
							start: '08:00',
							end: '18:00'
						},
						bookingRules: {
							maxAdvanceDays: 14,
							minAdvanceHours: 24,
							allowWeekends: true
						},
						serviceAreas: ['Manhattan', 'Brooklyn', 'Queens'],
						emergencyServices: true
					})
				]
			);
		}
		
		// Create service technicians (users)
		const technicians = [
			{
				id: uuidv4(),
				email: 'john@quickfix.com',
				firstName: 'John',
				lastName: 'Smith',
				role: 'user', // Changed from 'technician' to valid ENUM value
				specialties: ['plumbing', 'electrical']
			},
			{
				id: uuidv4(),
				email: 'maria@quickfix.com',
				firstName: 'Maria',
				lastName: 'Garcia',
				role: 'user', // Changed from 'technician' to valid ENUM value
				specialties: ['cleaning', 'painting']
			},
			{
				id: uuidv4(),
				email: 'admin@quickfix.com',
				firstName: 'Admin',
				lastName: 'User',
				role: 'admin',
				specialties: []
			}
		];
		
		// Check if users already exist for this tenant
		const [existingUsers] = await connection.execute(
			"SELECT COUNT(*) as count FROM users WHERE tenant_id = ?",
			[tenantId]
		);
		
		const usersExist = existingUsers[0].count > 0;
		
		if (usersExist) {
			console.log('Service providers already exist, skipping user creation...');
		} else {
			console.log('Creating service providers...');
			const hashedPassword = await bcrypt.hash('service123', 12);
			
			for (const tech of technicians) {
				await connection.execute(
					`INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, timezone, created_at, updated_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
					[
						tech.id,
						tenantId,
						tech.email,
						hashedPassword,
						tech.firstName,
						tech.lastName,
						tech.role,
						'America/New_York'
					]
				);
			}
		}
		
		// Create home service resources (service types/technicians)
		const homeServiceResources = [
			{
				id: uuidv4(),
				name: 'Plumbing Services - John Smith',
				description: 'Licensed plumber for repairs, installations, and maintenance',
				category: 'plumbing',
				capacity: 1, // One technician
				location: 'Mobile Service - NYC Area',
				userId: technicians[0].id,
				settings: {
					serviceTypes: [
						'Leak Repair',
						'Pipe Installation', 
						'Drain Cleaning',
						'Toilet Repair',
						'Faucet Installation'
					],
					pricing: {
						baseRate: 95,
						hourlyRate: 85,
						emergencyRate: 150
					},
					serviceRadius: 25, // miles
					estimatedDuration: {
						min: 60,  // 1 hour minimum
						max: 480  // 8 hours maximum
					},
					requiresAssessment: true,
					tools: ['pipe wrench', 'drain snake', 'torch'],
					certifications: ['NYC Plumbing License', 'EPA Lead-Safe']
				}
			},
			{
				id: uuidv4(),
				name: 'Electrical Services - John Smith', 
				description: 'Licensed electrician for wiring, outlets, and electrical repairs',
				category: 'electrical',
				capacity: 1,
				location: 'Mobile Service - NYC Area',
				userId: technicians[0].id,
				settings: {
					serviceTypes: [
						'Outlet Installation',
						'Light Fixture Installation',
						'Circuit Breaker Repair',
						'Wiring Repair',
						'Ceiling Fan Installation'
					],
					pricing: {
						baseRate: 110,
						hourlyRate: 95,
						emergencyRate: 175
					},
					serviceRadius: 20,
					estimatedDuration: {
						min: 90,
						max: 360
					},
					requiresAssessment: true,
					safetyRequirements: ['Turn off main breaker', 'Clear workspace'],
					certifications: ['NYC Electrical License', 'OSHA 10']
				}
			},
			{
				id: uuidv4(),
				name: 'House Cleaning - Maria Garcia',
				description: 'Professional residential cleaning services',
				category: 'cleaning',
				capacity: 1,
				location: 'Mobile Service - NYC Area', 
				userId: technicians[1].id,
				settings: {
					serviceTypes: [
						'Deep Cleaning',
						'Regular Cleaning',
						'Move-in/Move-out Cleaning',
						'Post-Construction Cleaning',
						'Window Cleaning'
					],
					pricing: {
						baseRate: 75,
						hourlyRate: 35,
						squareFootRate: 0.15 // per sq ft
					},
					serviceRadius: 30,
					estimatedDuration: {
						min: 120, // 2 hours minimum
						max: 480  // 8 hours maximum
					},
					supplies: ['eco-friendly cleaners', 'vacuum', 'microfiber cloths'],
					additionalServices: ['inside oven', 'inside fridge', 'garage']
				}
			},
			{
				id: uuidv4(),
				name: 'Interior Painting - Maria Garcia',
				description: 'Professional interior and exterior painting services',
				category: 'painting',
				capacity: 1,
				location: 'Mobile Service - NYC Area',
				userId: technicians[1].id,
				settings: {
					serviceTypes: [
						'Interior Room Painting',
						'Exterior House Painting',
						'Ceiling Painting',
						'Trim and Molding',
						'Cabinet Painting'
					],
					pricing: {
						baseRate: 150,
						hourlyRate: 45,
						squareFootRate: 2.50
					},
					serviceRadius: 25,
					estimatedDuration: {
						min: 240, // 4 hours minimum
						max: 960  // 16 hours (2 days)
					},
					materials: ['premium paint', 'brushes', 'rollers', 'drop cloths'],
					preparation: ['wall cleaning', 'hole filling', 'priming'],
					weatherDependent: true // for exterior work
				}
			},
			{
				id: uuidv4(),
				name: 'Emergency Repair Service',
				description: 'Same-day emergency repairs for urgent issues',
				category: 'emergency',
				capacity: 2, // Multiple technicians available
				location: 'Mobile Service - 24/7 NYC',
				settings: {
					serviceTypes: [
						'Emergency Plumbing',
						'Emergency Electrical',
						'Lock Repair',
						'Appliance Repair',
						'HVAC Emergency'
					],
					pricing: {
						baseRate: 200,
						hourlyRate: 125,
						emergencyFee: 75
					},
					serviceRadius: 15,
					estimatedDuration: {
						min: 60,
						max: 240
					},
					availability: '24/7',
					responseTime: 'Within 2 hours',
					multiTechnician: true
				}
			}
		];
		
		// Check if resources already exist for this tenant
		const [existingResources] = await connection.execute(
			"SELECT COUNT(*) as count FROM resources WHERE tenant_id = ?",
			[tenantId]
		);
		
		const resourcesExist = existingResources[0].count > 0;
		
		if (resourcesExist) {
			console.log('Home service resources already exist, skipping resource creation...');
		} else {
			console.log('Creating home service resources...');
			for (const resource of homeServiceResources) {
				await connection.execute(
					`INSERT INTO resources (id, tenant_id, name, description, category, capacity, location, settings, created_at, updated_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
					[
						resource.id,
						tenantId,
						resource.name,
						resource.description,
						resource.category,
						resource.capacity,
						resource.location,
						JSON.stringify(resource.settings)
					]
				);
			}
		}
		
		// Check if bookings already exist for this tenant
		const [existingBookings] = await connection.execute(
			"SELECT COUNT(*) as count FROM bookings WHERE tenant_id = ?",
			[tenantId]
		);
		
		const bookingsExist = existingBookings[0].count > 0;
		
		if (bookingsExist) {
			console.log('Demo home service bookings already exist, skipping booking creation...');
		} else {
			console.log('Creating demo home service bookings...');
			const today = new Date();
			const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
			const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
			
			// Get the first user for booking assignment
			const [userRows] = await connection.execute(
				"SELECT id FROM users WHERE tenant_id = ? LIMIT 1",
				[tenantId]
			);
			const userId = userRows.length > 0 ? userRows[0].id : technicians[0].id;
			
			// Get actual resource IDs from database
			const [resourceRows] = await connection.execute(
				"SELECT id, category FROM resources WHERE tenant_id = ?",
				[tenantId]
			);
			
			const plumbingResource = resourceRows.find(r => r.category === 'plumbing');
			const cleaningResource = resourceRows.find(r => r.category === 'cleaning');
			const paintingResource = resourceRows.find(r => r.category === 'painting');
			
			const serviceBookings = [
				{
					id: uuidv4(),
					resourceId: plumbingResource?.id || homeServiceResources[0].id,
					title: 'Kitchen Sink Leak Repair',
					description: 'Customer reports dripping under kitchen sink, needs urgent repair',
					startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0),
					endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0),
					status: 'confirmed',
					metadata: {
						customerAddress: '123 Main St, Apt 4B, New York, NY 10001',
						customerPhone: '(555) 123-4567',
						customerEmail: 'john.doe@email.com',
						issueType: 'leak repair',
						urgency: 'high',
						estimatedCost: 150,
						specialInstructions: 'Call when arriving, building has doorman'
					}
				},
				{
					id: uuidv4(),
					resourceId: cleaningResource?.id || homeServiceResources[2].id,
					title: 'Weekly House Cleaning',
					description: 'Regular weekly cleaning service for 2-bedroom apartment',
					startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 0),
					endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 13, 0),
					status: 'confirmed',
					metadata: {
						customerAddress: '456 Park Ave, New York, NY 10016',
						customerPhone: '(555) 987-6543',
						customerEmail: 'sarah.smith@email.com',
						serviceType: 'regular cleaning',
						apartmentSize: '2BR/2BA',
						estimatedCost: 180,
						recurringService: true,
						recurringFrequency: 'weekly',
						keyLocation: 'Hide-a-key under mat',
						pets: ['1 cat - friendly']
					}
				},
				{
					id: uuidv4(),
					resourceId: paintingResource?.id || homeServiceResources[3].id,
					title: 'Living Room Painting',
					description: 'Paint living room walls, ceiling needs touch-up',
					startTime: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 8, 0),
					endTime: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 16, 0),
					status: 'pending',
					metadata: {
						customerAddress: '789 Broadway, New York, NY 10003',
						customerPhone: '(555) 456-7890',
						customerEmail: 'mike.johnson@email.com',
						serviceType: 'interior painting',
						roomSize: '15x20 feet',
						paintColor: 'Sherwin Williams - Sea Salt',
						estimatedCost: 650,
						prepWorkNeeded: true,
						materialsCost: 150,
						customerSupplies: false
					}
				}
			];
			
			for (const booking of serviceBookings) {
				await connection.execute(
					`INSERT INTO bookings (id, tenant_id, resource_id, user_id, title, description, start_time, end_time, status, metadata, created_at, updated_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
					[
						booking.id,
						tenantId,
						booking.resourceId,
						userId,
						booking.title,
						booking.description,
						booking.startTime,
						booking.endTime,
						booking.status,
						JSON.stringify(booking.metadata)
					]
				);
			}
		}
		
		console.log('Home services tenant seeding completed successfully!');
		console.log('\\n=== QuickFix Home Services - Demo Credentials ===');
		console.log(`Tenant ID: ${tenantId}`);
		console.log(`API Key: ${apiKey}`);
		console.log(`Service Provider Login: john@quickfix.com / service123`);
		console.log(`Service Provider Login: maria@quickfix.com / service123`);
		console.log(`Admin Login: admin@quickfix.com / service123`);
		console.log('===========================================\\n');
		
		// Get actual resources from database for display
		const [finalResources] = await connection.execute(
			"SELECT name, category FROM resources WHERE tenant_id = ?",
			[tenantId]
		);
		
		console.log('Service Resources Available:');
		if (Array.isArray(finalResources) && finalResources.length > 0) {
			finalResources.forEach((resource, index) => {
				console.log(`${index + 1}. ${resource.name} (${resource.category})`);
			});
		} else {
			console.log('No resources found.');
		}
		
		await connection.end();
		
	} catch (error) {
		console.error('Home services seeding failed:', error);
		process.exit(1);
	}
}

seedHomeServices();
