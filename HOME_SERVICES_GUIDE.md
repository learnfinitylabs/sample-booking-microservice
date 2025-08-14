# Home Services API Usage Guide

This guide shows how the booking microservice can be adapted for home service businesses like plumbing, cleaning, painting, etc.

## 🏠 Home Services Resource Model

### Resource Flexibility

The current resource model is already flexible enough for home services:

```typescript
interface Resource {
  id: string;
  name: string;              // "Plumbing Services - John Smith"
  description: string;       // "Licensed plumber for repairs and installations"
  category: string;          // "plumbing", "cleaning", "painting", "electrical"
  capacity: number;          // 1 (single technician) or 2+ (team)
  location: string;          // "Mobile Service - NYC Area"
  settings: {
    serviceTypes: string[];    // ["Leak Repair", "Pipe Installation"]
    pricing: {
      baseRate: number;        // Service call fee
      hourlyRate: number;      // Per hour rate
      emergencyRate?: number;  // Emergency service rate
    };
    serviceRadius: number;     // Miles from base location
    estimatedDuration: {
      min: number;             // Minimum service time
      max: number;             // Maximum service time
    };
    // ... other service-specific settings
  }
}
```

## 🛠️ Service Categories & Examples

### 1. **Plumbing Services**
```json
{
  "name": "Plumbing Services - John Smith",
  "category": "plumbing", 
  "settings": {
    "serviceTypes": [
      "Leak Repair",
      "Pipe Installation",
      "Drain Cleaning", 
      "Toilet Repair",
      "Faucet Installation"
    ],
    "pricing": {
      "baseRate": 95,
      "hourlyRate": 85,
      "emergencyRate": 150
    },
    "tools": ["pipe wrench", "drain snake", "torch"],
    "certifications": ["NYC Plumbing License"]
  }
}
```

### 2. **House Cleaning**
```json
{
  "name": "House Cleaning - Maria Garcia",
  "category": "cleaning",
  "settings": {
    "serviceTypes": [
      "Deep Cleaning",
      "Regular Cleaning", 
      "Move-in/Move-out Cleaning"
    ],
    "pricing": {
      "baseRate": 75,
      "hourlyRate": 35,
      "squareFootRate": 0.15
    },
    "supplies": ["eco-friendly cleaners", "vacuum"]
  }
}
```

### 3. **Painting Services**
```json
{
  "name": "Interior Painting - Maria Garcia", 
  "category": "painting",
  "settings": {
    "serviceTypes": [
      "Interior Room Painting",
      "Exterior House Painting",
      "Cabinet Painting"
    ],
    "pricing": {
      "baseRate": 150,
      "hourlyRate": 45,
      "squareFootRate": 2.50
    },
    "weatherDependent": true
  }
}
```

## 📅 Booking Model for Home Services

The booking model stores customer and service details:

```typescript
interface Booking {
  // ... standard fields
  metadata: {
    // Customer Information
    customerAddress: string;
    customerPhone: string; 
    customerEmail: string;
    
    // Service Details
    issueType: string;
    urgency: "low" | "medium" | "high" | "emergency";
    estimatedCost: number;
    
    // Service-Specific
    apartmentSize?: string;      // For cleaning
    paintColor?: string;         // For painting
    roomSize?: string;           // For painting/electrical
    
    // Logistics
    keyLocation?: string;        // How to access property
    pets?: string[];             // Pet information
    specialInstructions?: string;
    
    // Recurring Services
    recurringService?: boolean;
    recurringFrequency?: "weekly" | "biweekly" | "monthly";
  }
}
```

## 🚀 API Usage Examples

### 1. **Create a Plumbing Service Booking**

```bash
curl -X POST "http://localhost:5173/api/bookings?api_key={API_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "resourceId": "plumbing-resource-id",
    "title": "Kitchen Sink Leak Repair", 
    "description": "Customer reports dripping under kitchen sink",
    "startTime": "2025-08-15T10:00:00",
    "endTime": "2025-08-15T12:00:00",
    "metadata": {
      "customerAddress": "123 Main St, Apt 4B, NYC",
      "customerPhone": "(555) 123-4567",
      "customerEmail": "john.doe@email.com",
      "issueType": "leak repair",
      "urgency": "high",
      "estimatedCost": 150,
      "specialInstructions": "Call when arriving, building has doorman"
    }
  }'
```

### 2. **Schedule Weekly House Cleaning**

```bash
curl -X POST "http://localhost:5173/api/bookings?api_key={API_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "resourceId": "cleaning-resource-id",
    "title": "Weekly House Cleaning",
    "description": "Regular weekly cleaning for 2BR apartment",
    "startTime": "2025-08-15T09:00:00", 
    "endTime": "2025-08-15T13:00:00",
    "metadata": {
      "customerAddress": "456 Park Ave, NYC",
      "customerPhone": "(555) 987-6543",
      "serviceType": "regular cleaning",
      "apartmentSize": "2BR/2BA", 
      "estimatedCost": 180,
      "recurringService": true,
      "recurringFrequency": "weekly",
      "pets": ["1 cat - friendly"]
    }
  }'
```

### 3. **Check Technician Availability**

```bash
curl "http://localhost:5173/api/resources/{technician-id}/availability?start_date=2025-08-15&end_date=2025-08-16&api_key={API_KEY}"
```

### 4. **Get Service Calendar View**

```bash
curl "http://localhost:5173/api/calendar?api_key={API_KEY}&month=2025-08"
```

## 🎯 Business Logic Adaptations

### 1. **Service Areas & Travel Time**
- Use `settings.serviceRadius` to limit booking area
- Add travel time between appointments in availability calculation
- Store base location for distance calculations

### 2. **Dynamic Pricing**
- Base rate + hourly rate + materials
- Emergency service surcharges
- Square footage pricing for cleaning/painting
- Weather-dependent scheduling

### 3. **Technician Skills & Certifications**
- Match service requests to qualified technicians
- Track certifications and expiration dates
- Skill-based resource allocation

### 4. **Customer Management**
- Store customer preferences and history
- Recurring service scheduling
- Customer notes and special requirements

## 📊 Reporting & Analytics

Use the existing API to generate home service reports:

### Service Performance
```bash
# Get all bookings for analysis
curl "http://localhost:5173/api/bookings?api_key={API_KEY}&limit=100"

# Filter by service type
curl "http://localhost:5173/api/calendar?api_key={API_KEY}&category=plumbing"
```

### Technician Utilization
```bash
# Get bookings by resource (technician)
curl "http://localhost:5173/api/bookings?api_key={API_KEY}&resource_id={technician-id}"
```

## 🔧 Setup Instructions

1. **Run the home services seed script:**
```bash
node scripts/seed-home-services.js
```

2. **The script creates:**
   - QuickFix Home Services tenant
   - 3 technician users (John, Maria, Admin)
   - 5 service resources (plumbing, electrical, cleaning, painting, emergency)
   - 3 demo bookings

3. **Use the generated API key** to test home service bookings

## 💡 Key Advantages

✅ **No schema changes needed** - Current resource model handles any service type
✅ **Flexible metadata** - Store any customer/service-specific information
✅ **Multi-technician support** - Handle teams or individual service providers
✅ **Location-aware** - Service areas and mobile service support
✅ **Pricing flexibility** - Multiple pricing models (hourly, flat rate, per sq ft)
✅ **Recurring services** - Perfect for regular cleaning, maintenance
✅ **Emergency services** - Same-day and urgent repair support

The booking microservice is already well-suited for home services with its flexible resource model! 🏠
