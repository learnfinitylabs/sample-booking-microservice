// Database configuration
export const DB_CONFIG = {
	host: process.env.DB_HOST || 'localhost',
	port: parseInt(process.env.DB_PORT || '3306'),
	user: process.env.DB_USER || 'booking_user',
	password: process.env.DB_PASSWORD || 'booking_pass',
	database: process.env.DB_NAME || 'booking_microservice',
	...(process.env.NODE_ENV === 'production' && {
		ssl: { rejectUnauthorized: false }
	})
};

export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
