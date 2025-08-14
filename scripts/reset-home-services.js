import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

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

async function resetHomeServices() {
	console.log('Resetting QuickFix Home Services tenant...');
	
	try {
		const connection = await mysql.createConnection(DB_CONFIG);
		
		// Find existing tenant
		const [existingRows] = await connection.execute(
			"SELECT id FROM tenants WHERE domain = 'quickfix.example.com'"
		);
		
		if (Array.isArray(existingRows) && existingRows.length > 0) {
			const tenantId = existingRows[0].id;
			console.log(`Found existing tenant: ${tenantId}`);
			
			// Delete in proper order due to foreign key constraints
			console.log('Cleaning up existing data...');
			await connection.execute("DELETE FROM booking_history WHERE tenant_id = ?", [tenantId]);
			await connection.execute("DELETE FROM bookings WHERE tenant_id = ?", [tenantId]);
			await connection.execute("DELETE FROM availability_windows WHERE tenant_id = ?", [tenantId]);
			await connection.execute("DELETE FROM resources WHERE tenant_id = ?", [tenantId]);
			await connection.execute("DELETE FROM users WHERE tenant_id = ?", [tenantId]);
			await connection.execute("DELETE FROM tenants WHERE id = ?", [tenantId]);
			
			console.log('✅ Existing tenant cleaned up successfully.');
		} else {
			console.log('No existing tenant found.');
		}
		
		// Create new tenant
		const newTenantId = uuidv4();
		const newApiKey = generateApiKey(newTenantId);
		
		console.log('Creating fresh QuickFix Home Services tenant...');
		await connection.execute(
			`INSERT INTO tenants (id, name, domain, api_key, settings, created_at, updated_at) 
			 VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
			[
				newTenantId,
				'QuickFix Home Services',
				'quickfix.example.com',
				newApiKey,
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
		
		console.log('✅ Fresh tenant created successfully!');
		console.log('\n=== QuickFix Home Services - NEW Demo Credentials ===');
		console.log(`Tenant ID: ${newTenantId}`);
		console.log(`API Key: ${newApiKey}`);
		console.log('====================================================\n');
		
		console.log('Now run: npm run db:seed:home-services');
		
		await connection.end();
		
	} catch (error) {
		console.error('Reset failed:', error);
		process.exit(1);
	}
}

resetHomeServices();
