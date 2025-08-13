import express from 'express';
import { emailService } from '../services/emailService.js';

const router = express.Router();

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
            res.status(500).json({
                success: false,
                error: 'Email sending failed',
                message: emailResult.message,
                details: emailResult.error
            });
        }
        
    } catch (error) {
        console.error('❌ Error in trading credentials endpoint:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to process trading credentials request'
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
