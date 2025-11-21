import express from 'express';
import { emailService } from '../services/emailService.js';

const router = express.Router();

// Track recent requests to prevent duplicates (mobile app issue)
const recentRequests = new Map();
const REQUEST_COOLDOWN = 5000; // 5 seconds cooldown per email

// Clean up old requests every minute
setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of recentRequests.entries()) {
        if (now - timestamp > REQUEST_COOLDOWN) {
            recentRequests.delete(key);
        }
    }
}, 60000);

// POST /http/trading-credentials
// Send trading credentials via email
router.post('/trading-credentials', async (req, res) => {
    try {
        const { emailID, tradingID, tradingPassword } = req.body;

        // Validate required fields
        if (!emailID || !tradingID || !tradingPassword) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'emailID, tradingID, and tradingPassword are required',
                required: ['emailID', 'tradingID', 'tradingPassword']
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailID)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format',
                message: 'Please provide a valid email address'
            });
        }

        // Validate trading ID and password (basic validation)
        if (tradingID.trim().length < 3) {
            return res.status(400).json({
                success: false,
                error: 'Invalid trading ID',
                message: 'Trading ID must be at least 3 characters long'
            });
        }

        if (tradingPassword.trim().length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Invalid trading password',
                message: 'Trading password must be at least 6 characters long'
            });
        }

        // Check for duplicate requests (prevents mobile app rapid-fire requests)
        const requestKey = `${emailID}-${tradingID}`;
        const lastRequestTime = recentRequests.get(requestKey);
        const now = Date.now();

        if (lastRequestTime && (now - lastRequestTime) < REQUEST_COOLDOWN) {
            const waitTime = Math.ceil((REQUEST_COOLDOWN - (now - lastRequestTime)) / 1000);
            return res.status(429).json({
                success: false,
                error: 'Too many requests',
                message: `Please wait ${waitTime} seconds before requesting credentials again`,
                retryAfter: waitTime,
                details: 'Duplicate request detected within cooldown period'
            });
        }

        // Mark this request timestamp
        recentRequests.set(requestKey, now);

        // Send email with trading credentials
        const emailResult = await emailService.sendTradingCredentials(emailID, tradingID, tradingPassword);

        if (emailResult.success) {
            res.status(200).json({
                success: true,
                message: 'Trading credentials sent successfully',
                data: {
                    emailID,
                    tradingID,
                    messageId: emailResult.messageId,
                    sentAt: new Date().toISOString()
                }
            });
        } else {
            // Check if it's a rate limit error from Gmail
            const isRateLimitError = emailResult.error &&
                (emailResult.error.includes('rate limit') ||
                    emailResult.error.includes('429') ||
                    emailResult.error.includes('Rate limit exceeded'));

            if (isRateLimitError) {
                // Remove from recent requests so they can try again later
                recentRequests.delete(requestKey);

                res.status(429).json({
                    success: false,
                    error: 'Email service rate limit',
                    message: 'Too many emails sent recently. Please try again in a few minutes.',
                    retryAfter: 60, // suggest 60 seconds
                    details: emailResult.error
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Email sending failed',
                    message: emailResult.message,
                    details: emailResult.error
                });
            }
        }

    } catch (error) {
        console.error('❌ Error in trading credentials endpoint:', error);
        console.error('Request from:', req.ip || req.connection.remoteAddress);
        console.error('User-Agent:', req.get('user-agent'));

        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to process trading credentials request'
        });
    }
});

// GET /http/trading-credentials/can-send/:emailID/:tradingID
// Check if user can send email (avoids 429 errors)
router.get('/trading-credentials/can-send/:emailID/:tradingID', (req, res) => {
    try {
        const { emailID, tradingID } = req.params;
        const requestKey = `${emailID}-${tradingID}`;
        const lastRequestTime = recentRequests.get(requestKey);
        const now = Date.now();

        if (lastRequestTime && (now - lastRequestTime) < REQUEST_COOLDOWN) {
            const waitTime = Math.ceil((REQUEST_COOLDOWN - (now - lastRequestTime)) / 1000);
            return res.status(200).json({
                canSend: false,
                reason: 'cooldown_active',
                message: `Please wait ${waitTime} seconds`,
                retryAfter: waitTime
            });
        }

        // Check email service queue
        const status = emailService.getEmailServiceStatus();
        if (status.queueLength > 10) {
            return res.status(200).json({
                canSend: false,
                reason: 'queue_full',
                message: 'Email service is processing many requests. Please try again shortly.',
                retryAfter: 30
            });
        }

        res.status(200).json({
            canSend: true,
            message: 'You can send the request now'
        });

    } catch (error) {
        console.error('❌ Error in can-send endpoint:', error);
        res.status(500).json({
            canSend: false,
            error: 'Internal server error'
        });
    }
});

// GET /http/trading-credentials/status
// Check email service status
router.get('/trading-credentials/status', (req, res) => {
    try {
        const status = emailService.getEmailServiceStatus();

        res.status(200).json({
            success: true,
            message: 'Email service status retrieved',
            data: status
        });

    } catch (error) {
        console.error('❌ Error getting email service status:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to get email service status'
        });
    }
});

// POST /http/trading-credentials/test
// Test email service
router.post('/trading-credentials/test', async (req, res) => {
    try {
        const testResult = await emailService.testEmailService();

        if (testResult.success) {
            res.status(200).json({
                success: true,
                message: 'Email service test successful',
                data: testResult
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Email service test failed',
                message: testResult.message,
                details: testResult.error
            });
        }

    } catch (error) {
        console.error('❌ Error testing email service:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to test email service'
        });
    }
});

export default router;
