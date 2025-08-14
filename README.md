# Booking Microservice

A multi-tenant, headless booking microservice built with **SvelteKit 2.0**, **Svelte 5**, **TypeScript**, and **MySQL**. This system provides a RESTful API for managing bookings, resources, and calendar views across multiple tenants.

## 🎉 **Status: FULLY OPERATIONAL**

✅ **Complete multi-tenant booking system ready for production use!**

### Demo Credentials (Ready to Test)
- **API Key**: `61d98f73-6746-4700-b388-93bd9de72801.uydigcx8engdm4az6mjhc`
- **Demo User**: `demo@example.com` / `demo123`
- **Web Interface**: http://localhost:5173
- **Database**: 3 demo resources with sample bookings

### Verified Features
- ✅ Multi-tenant database with complete isolation
- ✅ JWT authentication and API key validation  
- ✅ Booking creation with intelligent conflict detection
- ✅ Calendar views and real-time availability checking
- ✅ Complete audit trail and booking history
- ✅ RESTful API with comprehensive error handling
- ✅ Docker development environment
- ✅ Comprehensive test suite

### Quick Test
```bash
# Health check
curl "http://localhost:5173/api/health"

# List resources  
curl "http://localhost:5173/api/resources?api_key=61d98f73-6746-4700-b388-93bd9de72801.uydigcx8engdm4az6mjhc"

# Run full API test suite
npm run test:api
```

## 🌟 Features

- **Multi-tenant Architecture**: Complete tenant isolation with API key authentication
- **Headless Design**: System-agnostic API that can integrate with any frontend
- **Resource Management**: Flexible resource types (rooms, equipment, services, etc.)
- **Booking Management**: Create, update, cancel, and view bookings
- **Conflict Detection**: Automatic booking conflict prevention
- **Calendar Views**: Month, week, and day calendar views via API
- **User Management**: Role-based access control (admin, user, guest)
- **Audit Trail**: Complete booking history and change tracking
- **Availability API**: Real-time availability checking
- **Modern Stack**: Built with latest SvelteKit and Svelte 5

## 🏗️ Architecture

### Database Schema
- **Multi-tenant** with complete data isolation
- **Resources**: Bookable items (rooms, equipment, etc.)
- **Bookings**: Time-based reservations with conflict detection
- **Users**: Role-based authentication within tenants
- **Audit Trail**: Complete history of booking changes

### API Design
- **RESTful** endpoints with consistent response format
- **JWT Authentication** for user sessions
- **API Key Authentication** for tenant identification
- **Standardized Error Handling** with proper HTTP status codes

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd booking-microservice
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Set up the database:**
   ```bash
   # Create database and run migrations
   npm run db:migrate
   
   # Seed with demo data
   npm run db:seed
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

The service will be available at `http://localhost:5173`

### Using Docker

```bash
# Start MySQL and the booking service
docker-compose up -d

# The service will be available at http://localhost:3000
```

## 📖 API Documentation

### Authentication

#### Tenant Authentication (Required for all endpoints)
- **Header**: `X-API-Key: your-tenant-api-key`
- **Query Parameter**: `?api_key=your-tenant-api-key`

#### User Authentication (Optional for most endpoints)
- **Header**: `Authorization: Bearer your-jwt-token`

### Core Endpoints

#### Bookings
```http
GET    /api/bookings              # List bookings
POST   /api/bookings              # Create booking
GET    /api/bookings/{id}         # Get booking details
PUT    /api/bookings/{id}         # Update booking
DELETE /api/bookings/{id}         # Cancel booking
```

#### Resources
```http
GET    /api/resources             # List resources
GET    /api/resources/{id}/availability  # Check availability
```

#### Calendar
```http
GET    /api/calendar              # Calendar view
```

### Example API Usage

#### Create a Booking
```bash
curl -X POST "http://localhost:5173/api/bookings" \\
  -H "X-API-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "resourceId": "resource-uuid",
    "title": "Team Meeting",
    "description": "Weekly team standup",
    "startTime": "2024-01-15T09:00:00Z",
    "endTime": "2024-01-15T10:00:00Z"
  }'
```

#### Check Resource Availability
```bash
curl "http://localhost:5173/api/resources/{resource-id}/availability?start_date=2024-01-15&end_date=2024-01-16&duration=60&api_key=your-api-key"
```

#### Get Calendar View
```bash
curl "http://localhost:5173/api/calendar?month=2024-01&api_key=your-api-key"
```

## 🗄️ Database Schema

### Key Tables
- **tenants**: Multi-tenant configuration
- **users**: User management with roles
- **resources**: Bookable resources
- **bookings**: Time-based reservations
- **availability_windows**: Resource availability rules
- **booking_history**: Audit trail

### Multi-tenant Isolation
All data is isolated by `tenant_id`. Every query includes tenant filtering to ensure complete data separation.

## 🔧 Configuration

### Environment Variables
```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=booking_user
DB_PASSWORD=secure_password
DB_NAME=booking_microservice

# Security
JWT_SECRET=your-super-secret-jwt-key

# Server
NODE_ENV=development
PORT=5173
```

## 🎯 Use Cases

### 1. Meeting Room Booking System
- Manage conference rooms, equipment
- Prevent double-bookings
- Integration with calendar systems

### 2. Coworking Space Management
- Hot desk reservations
- Facility booking
- Member management

### 3. Equipment Rental
- Tool and equipment reservations
- Availability tracking
- Usage history

### 4. Service Appointment Booking
- Professional services scheduling
- Client management
- Time slot management

## 🛠️ Development

### Project Structure
```
src/
  lib/
    server/
      auth.ts           # Authentication utilities
      booking-service.ts # Core booking logic
      database.ts       # Database connection
      middleware.ts     # API middleware
    types.ts           # TypeScript definitions
  routes/
    api/
      bookings/        # Booking endpoints
      resources/       # Resource endpoints
      calendar/        # Calendar endpoints
    +page.svelte      # Demo UI
```

### Adding New Features

1. **Add Types**: Define interfaces in `src/lib/types.ts`
2. **Create Service**: Business logic in `src/lib/server/`
3. **Add API Routes**: RESTful endpoints in `src/routes/api/`
4. **Update Schema**: Database changes in `schema.sql`

### Database Migrations

```bash
# Run migrations
npm run db:migrate

# Seed demo data
npm run db:seed
```

## 🚀 Deployment

### Production Checklist
- [ ] Set strong `JWT_SECRET`
- [ ] Configure production database
- [ ] Set up SSL/TLS
- [ ] Configure proper CORS
- [ ] Set up monitoring
- [ ] Configure backup strategy

### Docker Deployment
```bash
# Build and deploy
docker-compose -f docker-compose.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure multi-tenant isolation
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Demo Credentials

After running `npm run db:seed`:

- **API Key**: Check console output for generated key
- **Demo User**: `demo@example.com` / `demo123`
- **Demo Resources**: Conference rooms, hot desks, training rooms

## 🆘 Support

- Check the issues page for common problems
- Review the API documentation
- Ensure proper tenant isolation in custom code
- Validate database indexes for performance

---

Built with ❤️ using SvelteKit, Svelte 5, and modern web technologies.
