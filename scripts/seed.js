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

async function seed() {
	console.log('Starting database seeding...');
	
	try {
		const connection = await mysql.createConnection(DB_CONFIG);
		
		// Create demo tenant
		const demoTenantId = uuidv4();
		const demoApiKey = generateApiKey(demoTenantId);
		
		console.log('Creating demo tenant...');
		await connection.execute(
			`INSERT INTO tenants (id, name, domain, api_key, settings, created_at, updated_at) 
			 VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
			[
				demoTenantId,
				'Demo Company',
				'demo.example.com',
				demoApiKey,
				JSON.stringify({
					timezone: 'UTC',
					businessHours: {
						start: '09:00',
						end: '18:00'
					},
					bookingRules: {
						maxAdvanceDays: 30,
						minAdvanceHours: 2
					}
				})
			]
		);
		
		// Create demo user
		const demoUserId = uuidv4();
		const hashedPassword = await bcrypt.hash('demo123', 12);
		
		console.log('Creating demo user...');
		await connection.execute(
			`INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, timezone, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
			[
				demoUserId,
				demoTenantId,
				'demo@example.com',
				hashedPassword,
				'Demo',
				'User',
				'admin',
				'UTC'
			]
		);
		
		// Create demo resources
		const resources = [
			{
				id: uuidv4(),
				name: 'Conference Room A',
				description: 'Large conference room with projector and video conferencing',
				category: 'meeting-room',
				capacity: 12,
				location: 'Building 1, Floor 2'
			},
			{
				id: uuidv4(),
				name: 'Hot Desk 1',
				description: 'Individual workspace with monitor and docking station',
				category: 'workspace',
				capacity: 1,
				location: 'Open Office Area'
			},
			{
				id: uuidv4(),
				name: 'Training Room',
				description: 'Training room with presentation equipment',
				category: 'training',
				capacity: 20,
				location: 'Building 1, Floor 1'
			}
		];
		
		console.log('Creating demo resources...');
		for (const resource of resources) {
			await connection.execute(
				`INSERT INTO resources (id, tenant_id, name, description, category, capacity, location, settings, created_at, updated_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
				[
					resource.id,
					demoTenantId,
					resource.name,
					resource.description,
					resource.category,
					resource.capacity,
					resource.location,
					JSON.stringify({
						bookingDuration: {
							min: 30,
							max: 480
						},
						autoConfirm: true
					})
				]
			);
		}
		
		// Create some demo bookings
		console.log('Creating demo bookings...');
		const today = new Date();
		const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
		
		const demoBookings = [
			{
				id: uuidv4(),
				resourceId: resources[0].id,
				title: 'Team Standup',
				description: 'Daily team standup meeting',
				startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0),
				endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30),
				status: 'confirmed'
			},
			{
				id: uuidv4(),
				resourceId: resources[0].id,
				title: 'Client Presentation',
				description: 'Quarterly review with client',
				startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 14, 0),
				endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 15, 30),
				status: 'pending'
			}
		];
		
		for (const booking of demoBookings) {
			await connection.execute(
				`INSERT INTO bookings (id, tenant_id, resource_id, user_id, title, description, start_time, end_time, status, created_at, updated_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
				[
					booking.id,
					demoTenantId,
					booking.resourceId,
					demoUserId,
					booking.title,
					booking.description,
					booking.startTime,
					booking.endTime,
					booking.status
				]
			);
		}
		
		console.log('Database seeding completed successfully!');
		console.log('\\n=== Demo Credentials ===');
		console.log(`Tenant ID: ${demoTenantId}`);
		console.log(`API Key: ${demoApiKey}`);
		console.log(`Demo User: demo@example.com / demo123`);
		console.log('========================\\n');
		
		await connection.end();
		
	} catch (error) {
		console.error('Seeding failed:', error);
		process.exit(1);
	}
}

seed();
