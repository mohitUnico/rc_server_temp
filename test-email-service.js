#!/usr/bin/env node

/**
 * Email Service Testing & Monitoring Utility
 * 
 * Usage:
 *   node test-email-service.js status      # Check email service status
 *   node test-email-service.js test        # Test email connection
 *   node test-email-service.js send <email> # Send test email
 */

import dotenv from 'dotenv';
import { emailService } from './services/emailService.js';

// Load environment variables
dotenv.config();

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkStatus() {
    log('\n📊 Email Service Status', 'cyan');
    log('═'.repeat(50), 'cyan');

    const status = emailService.getEmailServiceStatus();

    log(`\n🔧 Configuration:`, 'blue');
    log(`   Service: ${status.service}`);
    log(`   Email User: ${status.user}`);
    log(`   App Password: ${status.appPassword}`);

    log(`\n📋 Queue Status:`, 'blue');
    log(`   Queue Length: ${status.queueLength} emails waiting`);
    log(`   Processing: ${status.isProcessing ? 'Yes ⚙️' : 'No 💤'}`);

    log(`\n⏱️  Rate Limit Config:`, 'blue');
    log(`   Delay Between Emails: ${status.rateLimitConfig.minDelayBetweenEmails}`);
    log(`   Max Retries: ${status.rateLimitConfig.maxRetries}`);
    log(`   Initial Retry Delay: ${status.rateLimitConfig.initialRetryDelay}`);
    log(`   Max Retry Delay: ${status.rateLimitConfig.maxRetryDelay}`);

    // Check configuration
    if (status.user === 'Not configured' || status.appPassword === 'Not configured') {
        log('\n⚠️  WARNING: Email service is not fully configured!', 'yellow');
        log('   Please set EMAIL_USER and EMAIL_APP_PASSWORD in .env', 'yellow');
    } else {
        log('\n✅ Email service is fully configured', 'green');
    }

    // Calculate sending capacity
    const delayMs = parseInt(status.rateLimitConfig.minDelayBetweenEmails) || 2000;
    const emailsPerMinute = Math.floor(60000 / delayMs);
    const emailsPerHour = emailsPerMinute * 60;

    log(`\n📈 Estimated Capacity:`, 'blue');
    log(`   ~${emailsPerMinute} emails per minute`);
    log(`   ~${emailsPerHour} emails per hour`);

    if (emailsPerHour > 100) {
        log('   ⚠️  This exceeds Gmail free tier hourly limit (~100/hour)', 'yellow');
    }

    log('\n' + '═'.repeat(50) + '\n', 'cyan');
}

async function testConnection() {
    log('\n🧪 Testing Email Service Connection...', 'cyan');
    log('═'.repeat(50), 'cyan');

    try {
        const result = await emailService.testEmailService();

        if (result.success) {
            log('\n✅ Email service connection successful!', 'green');
            log('   Your SMTP settings are working correctly', 'green');
        } else {
            log('\n❌ Email service connection failed!', 'red');
            log(`   Error: ${result.error}`, 'red');

            log('\n💡 Troubleshooting:', 'yellow');
            log('   1. Check EMAIL_USER in .env is correct', 'yellow');
            log('   2. Verify EMAIL_APP_PASSWORD is a Gmail App Password', 'yellow');
            log('   3. Ensure 2FA is enabled on your Gmail account', 'yellow');
            log('   4. Check your internet connection', 'yellow');
        }
    } catch (error) {
        log('\n❌ Connection test error:', 'red');
        log(`   ${error.message}`, 'red');
    }

    log('\n' + '═'.repeat(50) + '\n', 'cyan');
}

async function sendTestEmail(recipientEmail) {
    if (!recipientEmail) {
        log('\n❌ Please provide a recipient email address', 'red');
        log('   Usage: node test-email-service.js send <email>', 'yellow');
        return;
    }

    log('\n📧 Sending Test Email...', 'cyan');
    log('═'.repeat(50), 'cyan');
    log(`   To: ${recipientEmail}`, 'blue');
    log(`   From: ${process.env.EMAIL_USER}`, 'blue');
    log('');

    try {
        const startTime = Date.now();

        const result = await emailService.sendTradingCredentials(
            recipientEmail,
            'TEST_' + Date.now(),
            'TestPassword123'
        );

        const duration = Date.now() - startTime;

        if (result.success) {
            log(`\n✅ Test email sent successfully!`, 'green');
            log(`   Time taken: ${duration}ms`, 'green');
            log(`   Message ID: ${result.messageId}`, 'green');
            log('\n📬 Please check the recipient inbox', 'cyan');
        } else {
            log(`\n❌ Failed to send test email`, 'red');
            log(`   Error: ${result.error}`, 'red');

            if (result.error.includes('rate limit') || result.error.includes('429')) {
                log('\n⚠️  Rate Limit Detected!', 'yellow');
                log('   Solutions:', 'yellow');
                log('   1. Increase EMAIL_MIN_DELAY in .env (e.g., 5000ms)', 'yellow');
                log('   2. Wait a few minutes and try again', 'yellow');
                log('   3. Check daily email limit hasn\'t been exceeded', 'yellow');
                log('   4. Consider using SendGrid/AWS SES for high volume', 'yellow');
            }
        }
    } catch (error) {
        log(`\n❌ Test email error:`, 'red');
        log(`   ${error.message}`, 'red');
    }

    log('\n' + '═'.repeat(50) + '\n', 'cyan');
}

async function sendBulkTest(count = 5) {
    log(`\n📧 Sending ${count} Test Emails (Bulk Test)`, 'cyan');
    log('═'.repeat(50), 'cyan');
    log('   This will test the queue and rate limiting system', 'blue');
    log('');

    const testEmail = process.env.EMAIL_USER; // Send to yourself
    const startTime = Date.now();

    log(`⏳ Queuing ${count} emails...`, 'yellow');

    const promises = [];
    for (let i = 1; i <= count; i++) {
        promises.push(
            emailService.sendTradingCredentials(
                testEmail,
                `BULK_TEST_${i}_${Date.now()}`,
                `TestPassword${i}`
            )
        );
    }

    try {
        const results = await Promise.all(promises);
        const duration = Date.now() - startTime;

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        log(`\n📊 Bulk Test Results:`, 'cyan');
        log(`   Total: ${count} emails`);
        log(`   ✅ Successful: ${successful}`, successful > 0 ? 'green' : 'reset');
        log(`   ❌ Failed: ${failed}`, failed > 0 ? 'red' : 'reset');
        log(`   ⏱️  Total time: ${(duration / 1000).toFixed(2)}s`);
        log(`   ⚡ Average: ${(duration / count / 1000).toFixed(2)}s per email`);

        if (successful === count) {
            log('\n✅ All emails sent successfully!', 'green');
            log('   Rate limiting is working correctly', 'green');
        } else if (failed > 0) {
            log('\n⚠️  Some emails failed', 'yellow');
            log('   Check the logs above for details', 'yellow');
        }
    } catch (error) {
        log(`\n❌ Bulk test error:`, 'red');
        log(`   ${error.message}`, 'red');
    }

    log('\n' + '═'.repeat(50) + '\n', 'cyan');
}

// Main execution
const command = process.argv[2];
const arg = process.argv[3];

log('\n🚀 Email Service Utility', 'cyan');

switch (command) {
    case 'status':
        await checkStatus();
        break;

    case 'test':
        await testConnection();
        break;

    case 'send':
        await sendTestEmail(arg);
        break;

    case 'bulk':
        const count = parseInt(arg) || 5;
        await sendBulkTest(count);
        break;

    default:
        log('\n📖 Available Commands:', 'blue');
        log('   node test-email-service.js status          # Check service status');
        log('   node test-email-service.js test            # Test SMTP connection');
        log('   node test-email-service.js send <email>    # Send test email');
        log('   node test-email-service.js bulk [count]    # Send bulk test (default: 5)');
        log('\n💡 Examples:', 'yellow');
        log('   node test-email-service.js status');
        log('   node test-email-service.js send user@example.com');
        log('   node test-email-service.js bulk 10');
        log('');
        break;
}

process.exit(0);

