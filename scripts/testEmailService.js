#!/usr/bin/env node

// scripts/testEmailService.js
// Test the email service functionality

import { emailService } from '../services/emailService.js';

async function testEmailService() {
    console.log('🧪 Testing Email Service...\n');
    
    // Test 1: Check email service status
    console.log('1️⃣ Checking email service status...');
    const status = emailService.getEmailServiceStatus();
    console.log('Status:', status);
    console.log('');
    
    // Test 2: Test email service connection
    console.log('2️⃣ Testing email service connection...');
    try {
        const testResult = await emailService.testEmailService();
        if (testResult.success) {
            console.log('✅ Email service connection successful');
        } else {
            console.log('❌ Email service connection failed:', testResult.error);
        }
    } catch (error) {
        console.log('❌ Email service test error:', error.message);
    }
    console.log('');
    
    // Test 3: Send test email (only if environment is configured)
    if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
        console.log('3️⃣ Sending test email...');
        try {
            const emailResult = await emailService.sendTradingCredentials(
                process.env.TEST_EMAIL || process.env.EMAIL_USER,
                'TEST123',
                'testpassword123'
            );
            
            if (emailResult.success) {
                console.log('✅ Test email sent successfully');
                console.log('Message ID:', emailResult.messageId);
            } else {
                console.log('❌ Test email failed:', emailResult.error);
            }
        } catch (error) {
            console.log('❌ Test email error:', error.message);
        }
    } else {
        console.log('3️⃣ Skipping test email (email credentials not configured)');
        console.log('Set EMAIL_USER and EMAIL_APP_PASSWORD environment variables to test');
    }
    
    console.log('\n🎯 Email Service Test Complete!');
}

// Run the test
testEmailService().catch(console.error);
