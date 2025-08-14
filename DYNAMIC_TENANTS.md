# Dynamic Tenant Configuration System

This booking microservice now supports **dynamic tenant configuration** that eliminates the need to hardcode API keys in your code. Perfect for different deployment environments!

## 🎯 Problem Solved

- ✅ **No more hardcoded API keys** in source code
- ✅ **Environment-specific configurations** (dev, staging, prod)
- ✅ **Automatic database synchronization** of tenant keys
- ✅ **Dynamic tenant discovery** from environment variables
- ✅ **Fallback support** for database-driven configs

## 🚀 How It Works

### **Method 1: Environment Variables (Recommended)**

The system automatically detects tenant API keys from environment variables that follow this pattern:
```bash
{TENANT_NAME}_API_KEY=your-api-key-here
```

#### Setup Steps:

1. **Automatic Sync from Database:**
   ```bash
   npm run db:sync-env
   ```
   This script will:
   - Connect to your database
   - Fetch all active tenants and their API keys
   - Generate appropriate environment variables in `.env`
   - Show you what was created

2. **Manual Environment Setup:**
   ```bash
   # Add to your .env file
   DEMO_COMPANY_API_KEY=61d98f73-6746-4700-b388-93bd9de72801.uydigcx8engdm4az6mjhc
   QUICKFIX_HOME_SERVICES_API_KEY=be63b48e-6090-4724-b601-788d0100cd08.mmp728enuzhxy17fncpg4
   ```

3. **Restart your server** to pick up new environment variables

### **Method 2: Database-Driven Configuration**

The system can also fetch tenant configurations directly from the database at runtime.

## 📡 API Endpoints

### **Environment-Based Config**
```http
GET /api/config/tenants
```
Returns tenants configured via environment variables.

**Response:**
```json
{
  "success": true,
  "data": {
    "tenants": [
      {
        "name": "Demo Company",
        "apiKey": "61d98f73-6746-4700-b388-93bd9de72801.uydigcx8engdm4az6mjhc"
      },
      {
        "name": "Quickfix Home Services", 
        "apiKey": "be63b48e-6090-4724-b601-788d0100cd08.mmp728enuzhxy17fncpg4"
      }
    ],
    "environment": "development",
    "source": "environment"
  }
}
```

### **Database-Driven Config**
```http
GET /api/config/tenants/db
```
Returns tenants fetched directly from database.

## 🔄 Calendar UI Integration

The calendar page (`/calendar`) now:

1. **Loads tenant configurations dynamically** on page load
2. **Tries database first**, falls back to environment variables
3. **Shows loading states** while fetching configuration
4. **Handles errors gracefully** with retry options
5. **Updates dropdown automatically** with discovered tenants

## 🏗️ Deployment Workflow

### **For Each Environment:**

1. **Development:**
   ```bash
   # Sync from local database
   npm run db:sync-env
   npm run dev
   ```

2. **Staging:**
   ```bash
   # Set environment variables in your hosting platform
   DEMO_COMPANY_API_KEY=staging-api-key-here
   QUICKFIX_HOME_SERVICES_API_KEY=staging-api-key-here
   ```

3. **Production:**
   ```bash
   # Use secure environment variable management
   DEMO_COMPANY_API_KEY=prod-api-key-here
   QUICKFIX_HOME_SERVICES_API_KEY=prod-api-key-here
   ```

## 📋 Scripts Available

| Script | Purpose |
|--------|---------|
| `npm run db:sync-env` | Sync tenant API keys from database to `.env` file |
| `npm run db:check:home-services` | Verify specific tenant configuration |
| `npm run dev` | Start development server |

## 🔧 Environment Variable Format

The system automatically converts tenant names to environment variable format:

| Tenant Name | Environment Variable |
|-------------|---------------------|
| "Demo Company" | `DEMO_COMPANY_API_KEY` |
| "QuickFix Home Services" | `QUICKFIX_HOME_SERVICES_API_KEY` |
| "Acme Corp" | `ACME_CORP_API_KEY` |

## 🛠️ Troubleshooting

### **No Tenants Showing:**
1. Check if `.env` file has tenant API keys
2. Run `npm run db:sync-env` to sync from database
3. Restart your development server
4. Check browser console for errors

### **Calendar Shows Error:**
1. Verify API keys are valid
2. Test endpoints directly: `curl http://localhost:5173/api/config/tenants`
3. Check database connection settings

### **New Environment Deployment:**
1. Run database migration: `npm run db:migrate`
2. Seed with tenants: `npm run db:seed`
3. Sync environment: `npm run db:sync-env`
4. Deploy with environment variables

## 💡 Benefits

- **🔒 Security:** API keys stored in environment variables, not code
- **🌍 Multi-Environment:** Different keys for dev/staging/prod
- **⚡ Performance:** Cached tenant configurations
- **🔄 Dynamic:** Automatically discovers new tenants
- **🛡️ Resilient:** Multiple fallback mechanisms
- **📊 Transparent:** Clear error messages and loading states

Now your booking microservice will work seamlessly across different environments without manual API key updates! 🎉
