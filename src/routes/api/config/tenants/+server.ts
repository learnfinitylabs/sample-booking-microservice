import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function GET() {
	try {
		// Dynamically find all tenant API keys in environment variables
		const tenants: Array<{name: string; apiKey: string}> = [];
		
		// Look for environment variables ending with _API_KEY
		Object.keys(env).forEach(key => {
			if (key.endsWith('_API_KEY') && env[key]) {
				// Convert env var name back to tenant name
				// e.g., "QUICKFIX_HOME_SERVICES_API_KEY" -> "QuickFix Home Services"
				const tenantName = key
					.replace(/_API_KEY$/, '')
					.split('_')
					.map(word => word.charAt(0) + word.slice(1).toLowerCase())
					.join(' ');
				
				tenants.push({
					name: tenantName,
					apiKey: env[key]!
				});
			}
		});

		// Fallback to hardcoded values if no environment variables found
		if (tenants.length === 0) {
			tenants.push(
				{
					name: 'Demo Office',
					apiKey: env.DEMO_OFFICE_API_KEY || 'be63b48e-6090-4724-b601-788d0100cd08.mmp728enuzhxy17fncpg4'
				},
				{
					name: 'QuickFix Home Services',
					apiKey: env.QUICKFIX_API_KEY || '9307a936-a8e9-4dfb-aaad-c13632877fd1.06sx7q70drury47fsa3704n'
				}
			);
		}

		// Filter out tenants without valid API keys
		const validTenants = tenants.filter(tenant => 
			tenant.apiKey && 
			tenant.apiKey !== 'your-demo-office-api-key-here' && 
			tenant.apiKey !== 'your-quickfix-api-key-here'
		);

		return json({
			success: true,
			data: {
				tenants: validTenants,
				environment: env.NODE_ENV || 'development',
				source: validTenants.length > 0 ? 'environment' : 'fallback'
			}
		});
	} catch (error) {
		console.error('Error fetching tenant config:', error);
		return json({
			success: false,
			error: 'Failed to fetch tenant configuration'
		}, { status: 500 });
	}
}
