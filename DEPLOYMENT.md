# Deployment Guide

This guide covers different deployment scenarios for the booking microservice.

## Local Development

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- Git

### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd booking-microservice

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Set up database
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

The service will be available at `http://localhost:5173`

## Docker Development

### Using Docker Compose
```bash
# Start all services (MySQL + App)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The service will be available at `http://localhost:3000`

### Database Setup with Docker
```bash
# Run migrations
docker-compose exec booking-service npm run db:migrate

# Seed demo data
docker-compose exec booking-service npm run db:seed
```

## Production Deployment

### Environment Variables
```bash
# Database
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=booking_user
DB_PASSWORD=secure_password
DB_NAME=booking_microservice

# Security
JWT_SECRET=super-secure-random-string-change-this

# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
```

### Build for Production
```bash
# Install dependencies
npm ci --only=production

# Build application
npm run build

# Start production server
node build
```

### Docker Production
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["node", "build"]
```

## Database Setup

### MySQL Configuration
```sql
-- Create database and user
CREATE DATABASE booking_microservice;
CREATE USER 'booking_user'@'%' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON booking_microservice.* TO 'booking_user'@'%';
FLUSH PRIVILEGES;
```

### Run Migrations
```bash
# Development
npm run db:migrate

# Production
NODE_ENV=production npm run db:migrate
```

### Seed Demo Data
```bash
npm run db:seed
```

## Cloud Deployment

### AWS ECS/Fargate
1. Build and push Docker image to ECR
2. Create ECS task definition
3. Set up RDS MySQL instance
4. Configure environment variables
5. Deploy to ECS service

### Google Cloud Run
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT-ID/booking-microservice
gcloud run deploy --image gcr.io/PROJECT-ID/booking-microservice --platform managed
```

### Heroku
```bash
# Add Heroku remote
heroku git:remote -a your-app-name

# Add MySQL addon
heroku addons:create jawsdb:kitefin

# Set environment variables
heroku config:set JWT_SECRET=your-jwt-secret
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Run migrations
heroku run npm run db:migrate
heroku run npm run db:seed
```

### DigitalOcean App Platform
1. Connect your GitHub repository
2. Set environment variables in dashboard
3. Configure database connection
4. Deploy automatically on push

## Reverse Proxy Setup

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Apache Configuration
```apache
<VirtualHost *:80>
    ServerName api.yourdomain.com
    
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    ProxyPreserveHost On
    ProxyAddHeaders On
</VirtualHost>
```

## SSL/TLS Setup

### Let's Encrypt with Certbot
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Logging

### Health Checks
The service provides a health check endpoint at `/api/health`

### Logging
- Application logs are written to stdout
- Use a log aggregation service in production
- Configure log levels via environment variables

### Monitoring
```bash
# CPU and Memory usage
docker stats

# Application metrics
curl http://localhost:3000/api/health
```

## Security Considerations

### Database Security
- Use strong passwords
- Enable SSL connections
- Restrict network access
- Regular security updates

### Application Security
- Set strong JWT secrets
- Use HTTPS in production
- Implement rate limiting
- Validate all inputs
- Regular dependency updates

### Network Security
- Use firewalls
- VPC/private networks
- Load balancers with SSL termination
- DDoS protection

## Backup Strategy

### Database Backups
```bash
# Create backup
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > backup.sql

# Restore backup
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < backup.sql
```

### Automated Backups
- Schedule regular database backups
- Store backups in multiple locations
- Test restore procedures regularly
- Document recovery procedures

## Performance Optimization

### Database Optimization
- Proper indexing (already included in schema)
- Connection pooling
- Query optimization
- Regular maintenance

### Application Optimization
- Enable compression
- Use CDN for static assets
- Implement caching
- Monitor performance metrics

### Load Balancing
```nginx
upstream booking_service {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    location / {
        proxy_pass http://booking_service;
    }
}
```

## Troubleshooting

### Common Issues
1. **Database connection fails**: Check credentials and network access
2. **API key errors**: Ensure proper seeding and key format
3. **CORS issues**: Configure proper headers for frontend access
4. **Performance issues**: Check database indexes and query performance

### Debug Mode
```bash
# Enable debug logging
DEBUG=booking:* npm run dev
```

### Health Monitoring
```bash
# Check application health
curl http://localhost:3000/api/health

# Check database connectivity
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "SELECT 1"
```

## Scaling Considerations

### Horizontal Scaling
- Multiple application instances
- Load balancer
- Shared database
- Session management

### Database Scaling
- Read replicas
- Connection pooling
- Query optimization
- Sharding (for very large deployments)

### Caching
- Redis for session storage
- Application-level caching
- Database query caching
- CDN for static content
