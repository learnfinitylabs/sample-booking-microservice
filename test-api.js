#!/usr/bin/env node

/**
 * Simple test script to verify the booking microservice API
 * Run with: node test-api.js
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5173';
const API_KEY = process.env.API_KEY || '61d98f73-6746-4700-b388-93bd9de72801.uydigcx8engdm4az6mjhc'; // Demo tenant API key

async function testApi() {
	console.log('🧪 Testing Booking Microservice API');
	console.log(`Base URL: ${BASE_URL}`);
	console.log('=' .repeat(50));
	
	try {
		// Test health check
		await testHealthCheck();
		
		// Test API documentation
		await testApiDocs();
		
		// Test resources (requires seeded data)
		await testResources();
		
		// Test bookings (requires seeded data)
		await testBookings();
		
		// Test calendar view
		await testCalendar();
		
		console.log('\\n✅ All tests completed successfully!');
		
	} catch (error) {
		console.error('\\n❌ Test failed:', error.message);
		process.exit(1);
	}
}

async function testHealthCheck() {
	console.log('\\n🔍 Testing health check...');
	
	const response = await fetch(`${BASE_URL}/api/health`);
	const data = await response.json();
	
	console.log(`Status: ${response.status}`);
	console.log(`Health: ${data.status}`);
	console.log(`Database: ${data.services?.database || 'unknown'}`);
	
	if (response.status !== 200) {
		throw new Error(`Health check failed: ${data.status}`);
	}
}

async function testApiDocs() {
	console.log('\\n📚 Testing API documentation...');
	
	const response = await fetch(`${BASE_URL}/api/docs`);
	const data = await response.json();
	
	console.log(`Status: ${response.status}`);
	console.log(`Title: ${data.title}`);
	console.log(`Version: ${data.version}`);
	
	if (response.status !== 200) {
		throw new Error('API docs endpoint failed');
	}
}

async function testResources() {
	console.log('\\n🏢 Testing resources endpoint...');
	
	const response = await fetch(`${BASE_URL}/api/resources?api_key=${API_KEY}`);
	const data = await response.json();
	
	console.log(`Status: ${response.status}`);
	console.log(`Success: ${data.success}`);
	
	if (data.success) {
		console.log(`Resources found: ${data.data?.length || 0}`);
		if (data.data?.length > 0) {
			console.log(`First resource: ${data.data[0].name}`);
		}
	} else {
		console.log(`Error: ${data.error}`);
	}
}

async function testBookings() {
	console.log('\\n📅 Testing bookings endpoint...');
	
	const response = await fetch(`${BASE_URL}/api/bookings?api_key=${API_KEY}`);
	const data = await response.json();
	
	console.log(`Status: ${response.status}`);
	console.log(`Success: ${data.success}`);
	
	if (data.success) {
		console.log(`Bookings found: ${data.data?.length || 0}`);
		if (data.data?.length > 0) {
			console.log(`First booking: ${data.data[0].title}`);
		}
	} else {
		console.log(`Error: ${data.error}`);
	}
}

async function testCalendar() {
	console.log('\\n📆 Testing calendar endpoint...');
	
	const response = await fetch(`${BASE_URL}/api/calendar?api_key=${API_KEY}`);
	const data = await response.json();
	
	console.log(`Status: ${response.status}`);
	console.log(`Success: ${data.success}`);
	
	if (data.success) {
		console.log(`Calendar bookings: ${data.data?.bookings?.length || 0}`);
		console.log(`Calendar resources: ${data.data?.resources?.length || 0}`);
		console.log(`Total bookings: ${data.data?.summary?.totalBookings || 0}`);
	} else {
		console.log(`Error: ${data.error}`);
	}
}

// Run tests
testApi();
