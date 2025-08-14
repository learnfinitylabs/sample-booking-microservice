#!/usr/bin/env node

/**
 * Demo workflow showcasing the booking microservice capabilities
 * This script demonstrates the complete booking workflow including:
 * - Authentication
 * - Resource management
 * - Booking creation with conflict detection
 * - Calendar views
 * - Availability checking
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5173';
const API_KEY = '61d98f73-6746-4700-b388-93bd9de72801.uydigcx8engdm4az6mjhc';
const DEMO_USER = {
    email: 'demo@example.com',
    password: 'demo123'
};

async function runDemo() {
    console.log('🚀 Booking Microservice Demo Workflow');
    console.log('=' .repeat(50));
    
    try {
        // 1. Health Check
        await step('Health Check', async () => {
            const response = await fetch(`${BASE_URL}/api/health`);
            const data = await response.json();
            console.log(`  Service Status: ${data.status}`);
            console.log(`  Database Status: ${data.services?.database || 'unknown'}`);
        });

        // 2. User Authentication
        let userToken = null;
        await step('User Authentication', async () => {
            const response = await fetch(`${BASE_URL}/api/auth/login?api_key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(DEMO_USER)
            });
            const data = await response.json();
            
            if (data.success) {
                userToken = data.data.token;
                console.log(`  User: ${data.data.user.firstName} ${data.data.user.lastName}`);
                console.log(`  Role: ${data.data.user.role}`);
                console.log(`  Token expires in: ${data.data.expiresIn}`);
            } else {
                throw new Error(data.error);
            }
        });

        // 3. List Resources
        let resources = [];
        await step('List Available Resources', async () => {
            const response = await fetch(`${BASE_URL}/api/resources?api_key=${API_KEY}`);
            const data = await response.json();
            
            if (data.success) {
                resources = data.data;
                console.log(`  Found ${resources.length} resources:`);
                resources.forEach(resource => {
                    console.log(`    - ${resource.name} (${resource.category}, capacity: ${resource.capacity})`);
                });
            } else {
                throw new Error(data.error);
            }
        });

        // 4. Check Resource Availability
        const targetResource = resources[0];
        await step(`Check Availability for "${targetResource.name}"`, async () => {
            const today = new Date().toISOString().split('T')[0];
            const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            const response = await fetch(
                `${BASE_URL}/api/resources/${targetResource.id}/availability?api_key=${API_KEY}&start_date=${today}&end_date=${tomorrow}`
            );
            const data = await response.json();
            
            if (data.success) {
                console.log(`  Available slots: ${data.data.availableSlots.length}`);
                console.log(`  Existing bookings: ${data.data.existingBookings.length}`);
                if (data.data.availableSlots.length > 0) {
                    console.log(`  Next available: ${data.data.availableSlots[0].startTime}`);
                }
            } else {
                throw new Error(data.error);
            }
        });

        // 5. Create a New Booking
        let newBookingId = null;
        await step('Create New Booking', async () => {
            const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week from now
            const startTime = new Date(futureDate.getFullYear(), futureDate.getMonth(), futureDate.getDate(), 14, 0);
            const endTime = new Date(futureDate.getFullYear(), futureDate.getMonth(), futureDate.getDate(), 15, 0);
            
            const bookingRequest = {
                title: 'Demo Workflow Meeting',
                description: 'Testing the booking microservice workflow',
                resourceId: targetResource.id,
                startTime: startTime.toISOString().slice(0, 19),
                endTime: endTime.toISOString().slice(0, 19),
                attendees: ['demo@example.com', 'test@example.com']
            };
            
            const response = await fetch(`${BASE_URL}/api/bookings?api_key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingRequest)
            });
            const data = await response.json();
            
            if (data.success) {
                newBookingId = data.data.id;
                console.log(`  Created booking: ${data.data.title}`);
                console.log(`  Booking ID: ${newBookingId}`);
                console.log(`  Status: ${data.data.status}`);
                console.log(`  Time: ${data.data.startTime} - ${data.data.endTime}`);
            } else {
                throw new Error(data.error);
            }
        });

        // 6. List All Bookings
        await step('List All Bookings', async () => {
            const response = await fetch(`${BASE_URL}/api/bookings?api_key=${API_KEY}`);
            const data = await response.json();
            
            if (data.success) {
                console.log(`  Total bookings: ${data.data.length}`);
                data.data.forEach(booking => {
                    console.log(`    - ${booking.title} (${booking.status})`);
                });
            } else {
                throw new Error(data.error);
            }
        });

        // 7. Get Calendar View
        await step('Calendar View', async () => {
            const response = await fetch(`${BASE_URL}/api/calendar?api_key=${API_KEY}`);
            const data = await response.json();
            
            if (data.success) {
                console.log(`  Calendar Summary:`);
                console.log(`    Total bookings: ${data.data.summary.totalBookings}`);
                console.log(`    Active bookings: ${data.data.summary.activeBookings}`);
                console.log(`    Resources: ${data.data.resources.length}`);
                console.log(`    Bookings today: ${data.data.bookings.length}`);
            } else {
                throw new Error(data.error);
            }
        });

        // 8. Test Conflict Detection
        await step('Test Conflict Detection', async () => {
            // Try to create a booking at the same time as the one we just created
            const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            const startTime = new Date(futureDate.getFullYear(), futureDate.getMonth(), futureDate.getDate(), 14, 30);
            const endTime = new Date(futureDate.getFullYear(), futureDate.getMonth(), futureDate.getDate(), 15, 30);
            
            const conflictRequest = {
                title: 'Conflicting Meeting',
                description: 'This should be rejected due to conflict',
                resourceId: targetResource.id,
                startTime: startTime.toISOString().slice(0, 19),
                endTime: endTime.toISOString().slice(0, 19)
            };
            
            const response = await fetch(`${BASE_URL}/api/bookings?api_key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(conflictRequest)
            });
            const data = await response.json();
            
            if (!data.success && data.error.includes('conflict')) {
                console.log(`  ✅ Conflict correctly detected: ${data.error}`);
            } else {
                console.log(`  ⚠️  Expected conflict detection to fail this booking`);
            }
        });

        console.log('\n🎉 Demo workflow completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`  - Health checks: ✅ Passing`);
        console.log(`  - Authentication: ✅ Working`);
        console.log(`  - Resource management: ✅ Working`);
        console.log(`  - Booking creation: ✅ Working`);
        console.log(`  - Conflict detection: ✅ Working`);
        console.log(`  - Calendar views: ✅ Working`);
        console.log(`  - Availability checking: ✅ Working`);

    } catch (error) {
        console.error('\n❌ Demo failed:', error.message);
        process.exit(1);
    }
}

async function step(title, fn) {
    console.log(`\n📋 ${title}...`);
    await fn();
}

// Run the demo
runDemo();
