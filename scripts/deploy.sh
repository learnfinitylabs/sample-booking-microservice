#!/bin/bash

# Deployment Environment Setup Script
# This script sets up tenant configurations for different environments

set -e

ENVIRONMENT=${1:-development}
echo "🚀 Setting up booking microservice for: $ENVIRONMENT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 Environment: $ENVIRONMENT${NC}"

case $ENVIRONMENT in
  development)
    echo -e "${GREEN}🔧 Development Setup${NC}"
    echo "1. Starting database..."
    docker-compose up -d mysql
    
    echo "2. Running migrations..."
    npm run db:migrate
    
    echo "3. Seeding database..."
    npm run db:seed
    npm run db:seed:home-services
    
    echo "4. Syncing environment variables..."
    npm run db:sync-env
    
    echo "5. Starting development server..."
    npm run dev
    ;;
    
  staging)
    echo -e "${YELLOW}🔧 Staging Setup${NC}"
    echo "Environment variables should be set by your hosting platform:"
    echo "- DEMO_COMPANY_API_KEY"
    echo "- QUICKFIX_HOME_SERVICES_API_KEY"
    echo "- DB_HOST, DB_USER, DB_PASSWORD, etc."
    
    echo "Building application..."
    npm run build
    ;;
    
  production)
    echo -e "${RED}🔧 Production Setup${NC}"
    echo "⚠️  Ensure these environment variables are securely configured:"
    echo "- DEMO_COMPANY_API_KEY"
    echo "- QUICKFIX_HOME_SERVICES_API_KEY"
    echo "- JWT_SECRET (change from default!)"
    echo "- DB_HOST, DB_USER, DB_PASSWORD"
    echo "- NODE_ENV=production"
    
    echo "Building application..."
    npm run build
    ;;
    
  *)
    echo -e "${RED}❌ Unknown environment: $ENVIRONMENT${NC}"
    echo "Usage: $0 [development|staging|production]"
    exit 1
    ;;
esac

echo -e "${GREEN}✅ Setup complete for $ENVIRONMENT environment!${NC}"

if [[ $ENVIRONMENT == "development" ]]; then
  echo ""
  echo -e "${GREEN}🌐 Your application should now be running at:${NC}"
  echo "   📊 API Demo: http://localhost:5173"
  echo "   📅 Calendar: http://localhost:5173/calendar"
  echo "   📖 API Docs: http://localhost:5173/api/docs"
  echo ""
  echo -e "${YELLOW}💡 Tenant API Keys:${NC}"
  if [[ -f .env ]]; then
    grep "_API_KEY" .env | sed 's/^/   /'
  fi
fi
