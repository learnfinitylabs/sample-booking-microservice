#!/usr/bin/env node

import mysql from 'mysql2/promise';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
	host: process.env.DB_HOST || 'localhost',
	port: process.env.DB_PORT || 3306,
	user: process.env.DB_USER || 'root',
	password: process.env.DB_PASSWORD || 'booking123',
	database: process.env.DB_NAME || 'booking_microservice'
};

async function updateEnvWithTenantKeys() {
	let connection;
	
	try {
		console.log('🔍 Fetching tenant API keys from database...');
		
		connection = await mysql.createConnection(config);
		
		const [rows] = await connection.execute(`
			SELECT name, api_key 
			FROM tenants 
			WHERE is_active = TRUE 
			ORDER BY name
		`);
		
		if (!rows.length) {
			console.log('⚠️  No active tenants found in database');
			return;
		}
		
		console.log(`📋 Found ${rows.length} active tenant(s):`);
		rows.forEach((tenant, index) => {
			console.log(`   ${index + 1}. ${tenant.name}: ${tenant.api_key.split('.')[0]}...`);
		});
		
		// Read existing .env file if it exists
		const envPath = path.join(path.dirname(__dirname), '.env');
		let envContent = '';
		
		try {
			envContent = await fs.readFile(envPath, 'utf8');
		} catch (error) {
			console.log('📝 Creating new .env file...');
		}
		
		// Update environment variables based on tenant names
		let updatedContent = envContent;
		
		rows.forEach(tenant => {
			const envVarName = generateEnvVarName(tenant.name);
			const envLine = `${envVarName}=${tenant.api_key}\n`;
			
			// Check if variable already exists and update it
			const regex = new RegExp(`^${envVarName}=.*$`, 'm');
			if (regex.test(updatedContent)) {
				updatedContent = updatedContent.replace(regex, `${envVarName}=${tenant.api_key}`);
				console.log(`✅ Updated ${envVarName}`);
			} else {
				updatedContent += `\n# ${tenant.name} API Key\n${envLine}`;
				console.log(`➕ Added ${envVarName}`);
			}
		});
		
		// Write updated .env file
		await fs.writeFile(envPath, updatedContent);
		console.log('💾 Environment file updated successfully!');
		
		// Show usage instructions
		console.log('\n📖 Usage Instructions:');
		console.log('1. Restart your development server to load new environment variables');
		console.log('2. The calendar will now dynamically load tenant configurations');
		console.log('3. Environment variables created:');
		rows.forEach(tenant => {
			console.log(`   - ${generateEnvVarName(tenant.name)}`);
		});
		
	} catch (error) {
		console.error('❌ Error updating environment file:', error);
		process.exit(1);
	} finally {
		if (connection) {
			await connection.end();
		}
	}
}

function generateEnvVarName(tenantName) {
	// Convert tenant name to environment variable format
	// e.g., "QuickFix Home Services" -> "QUICKFIX_HOME_SERVICES_API_KEY"
	return tenantName
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, '_')
		.replace(/_+/g, '_')
		.replace(/^_|_$/g, '') + '_API_KEY';
}

// Run the script
updateEnvWithTenantKeys();
