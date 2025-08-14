import mysql from 'mysql2/promise';

const DB_CONFIG = {
	host: process.env.DB_HOST || 'localhost',
	port: parseInt(process.env.DB_PORT || '3306'),
	user: process.env.DB_USER || 'booking_user',
	password: process.env.DB_PASSWORD || 'booking_pass',
	database: process.env.DB_NAME || 'booking_microservice'
};

async function checkHomeServicesTenant() {
	console.log('Checking for existing QuickFix Home Services tenant...');
	
	try {
		const connection = await mysql.createConnection(DB_CONFIG);
		
		// Check for existing tenant
		const [rows] = await connection.execute(
			"SELECT id, name, domain, api_key FROM tenants WHERE domain = 'quickfix.example.com'"
		);
		
		if (Array.isArray(rows) && rows.length > 0) {
			const tenant = rows[0];
			console.log('\n✅ QuickFix Home Services tenant already exists!');
			console.log('=== QuickFix Home Services - Demo Credentials ===');
			console.log(`Tenant ID: ${tenant.id}`);
			console.log(`API Key: ${tenant.api_key}`);
			console.log(`Service Provider Login: john@quickfix.com / service123`);
			console.log(`Service Provider Login: maria@quickfix.com / service123`);
			console.log(`Admin Login: admin@quickfix.com / service123`);
			console.log('===========================================\n');
			
			// Check resources
			const [resourceRows] = await connection.execute(
				"SELECT name, category FROM resources WHERE tenant_id = ?",
				[tenant.id]
			);
			
			console.log('Service Resources Available:');
			if (Array.isArray(resourceRows) && resourceRows.length > 0) {
				resourceRows.forEach((resource, index) => {
					console.log(`${index + 1}. ${resource.name} (${resource.category})`);
				});
			} else {
				console.log('No resources found for this tenant.');
			}
			
		} else {
			console.log('❌ QuickFix Home Services tenant not found.');
			console.log('You can create it by running: npm run db:seed:home-services');
		}
		
		await connection.end();
		
	} catch (error) {
		console.error('Error checking tenant:', error);
		process.exit(1);
	}
}

checkHomeServicesTenant();
