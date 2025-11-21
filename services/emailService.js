import nodemailer from 'nodemailer';
import { LOGO_PATH } from '../config/envConfig.js';

export class EmailService {
    constructor() {
        // Create transporter for Gmail (you can change this to your preferred email provider)
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,        // Your Gmail address
                pass: process.env.EMAIL_APP_PASSWORD // Gmail App Password (not regular password)
            }
        });

        // Rate limiting configuration
        this.emailQueue = [];
        this.isProcessing = false;
        this.lastEmailTime = 0;

        // Configure based on Gmail type (adjust these values as needed)
        this.config = {
            minDelayBetweenEmails: parseInt(process.env.EMAIL_MIN_DELAY) || 2000, // 2 seconds between emails
            maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES) || 3,
            initialRetryDelay: parseInt(process.env.EMAIL_INITIAL_RETRY_DELAY) || 5000, // 5 seconds
            maxRetryDelay: parseInt(process.env.EMAIL_MAX_RETRY_DELAY) || 60000, // 60 seconds
        };
    }

    // Add email to queue with rate limiting
    async queueEmail(emailOptions) {
        return new Promise((resolve, reject) => {
            this.emailQueue.push({ emailOptions, resolve, reject, retries: 0 });
            if (!this.isProcessing) {
                this.processQueue();
            }
        });
    }

    // Process email queue with rate limiting
    async processQueue() {
        if (this.isProcessing || this.emailQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.emailQueue.length > 0) {
            const { emailOptions, resolve, reject, retries } = this.emailQueue.shift();

            // Rate limiting: wait if we sent an email recently
            const now = Date.now();
            const timeSinceLastEmail = now - this.lastEmailTime;
            if (timeSinceLastEmail < this.config.minDelayBetweenEmails) {
                const waitTime = this.config.minDelayBetweenEmails - timeSinceLastEmail;
                console.log(`⏳ Rate limiting: waiting ${waitTime}ms before sending next email`);
                await this.sleep(waitTime);
            }

            try {
                // Try to send the email
                const info = await this.transporter.sendMail(emailOptions);
                this.lastEmailTime = Date.now();
                resolve({
                    success: true,
                    messageId: info.messageId,
                    message: 'Email sent successfully'
                });
            } catch (error) {
                // Handle rate limit errors (429) with exponential backoff
                if (error.responseCode === 429 || error.message.includes('rate limit') || error.message.includes('429')) {
                    if (retries < this.config.maxRetries) {
                        const retryDelay = Math.min(
                            this.config.initialRetryDelay * Math.pow(2, retries),
                            this.config.maxRetryDelay
                        );

                        console.log(`⚠️ Rate limit hit (429). Retry ${retries + 1}/${this.config.maxRetries} after ${retryDelay}ms`);

                        // Re-queue the email at the front with updated retry count
                        this.emailQueue.unshift({
                            emailOptions,
                            resolve,
                            reject,
                            retries: retries + 1
                        });

                        // Wait before processing next email
                        await this.sleep(retryDelay);
                    } else {
                        console.error(`❌ Max retries (${this.config.maxRetries}) exceeded for email`);
                        reject({
                            success: false,
                            error: 'Rate limit exceeded. Max retries reached.',
                            originalError: error.message
                        });
                    }
                } else {
                    // Other errors
                    console.error('❌ Email send error:', error);
                    reject({
                        success: false,
                        error: error.message
                    });
                }
            }
        }

        this.isProcessing = false;
    }

    // Helper function to sleep/delay
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Send trading credentials via email (now with rate limiting and retry logic)
    async sendTradingCredentials(emailID, tradingID, tradingPassword) {
        try {
            // Email template
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: emailID,
                subject: '🔐 Your Trading Credentials - Secure Access',
                html: `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Trading Credentials</title>
                        <style>
                            body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
                            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
                            .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 40px 30px; text-align: center; color: white; }
                            .logo { width: 80px; height: 80px; margin: 0 auto 20px; display: block; }
                            .title { font-size: 28px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
                            .subtitle { font-size: 16px; opacity: 0.9; margin: 10px 0 0; }
                            .content { padding: 40px 30px; }
                            .credentials-box { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 15px; padding: 30px; margin: 30px 0; border-left: 5px solid #28a745; }
                            .credential-item { margin: 20px 0; }
                            .credential-label { font-size: 14px; color: #6c757d; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: 600; }
                            .credential-value { font-size: 24px; font-weight: 700; color: #1e3c72; background: white; padding: 15px 20px; border-radius: 10px; border: 2px solid #e9ecef; font-family: 'Courier New', monospace; letter-spacing: 2px; }
                            .security-notice { background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); border: 1px solid #ffc107; border-radius: 15px; padding: 25px; margin: 30px 0; }
                            .security-title { color: #856404; font-size: 18px; font-weight: 700; margin: 0 0 15px; display: flex; align-items: center; }
                            .security-icon { font-size: 24px; margin-right: 10px; }
                            .security-list { color: #856404; margin: 0; padding-left: 20px; }
                            .security-list li { margin: 8px 0; }
                            .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #6c757d; border-top: 1px solid #e9ecef; }
                            .footer p { margin: 8px 0; font-size: 14px; }
                            .highlight { color: #1e3c72; font-weight: 600; }
                            .cta-button { display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; margin: 20px 0; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3); }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <img src="cid:logo" alt="Trading Platform Logo" class="logo">
                                <h1 class="title">🔐 Trading Credentials</h1>
                                <p class="subtitle">Your secure access to the trading platform</p>
                            </div>
                            
                            <div class="content">
                                <div class="credentials-box">
                                    <h2 style="color: #1e3c72; margin: 0 0 25px; text-align: center; font-size: 22px;">🎯 Account Information</h2>
                                    
                                    <div class="credential-item">
                                        <div class="credential-label">Trading ID</div>
                                        <div class="credential-value">${tradingID}</div>
                                    </div>
                                    
                                    <div class="credential-item">
                                        <div class="credential-label">Trading Password</div>
                                        <div class="credential-value">${tradingPassword}</div>
                                    </div>
                                </div>
                                
                                <div class="security-notice">
                                    <h3 class="security-title">
                                        <span class="security-icon">⚠️</span>
                                        Security Notice
                                    </h3>
                                    <ul class="security-list">
                                        <li>Keep your credentials secure and confidential</li>
                                        <li>Never share your password with anyone</li>
                                        <li>Change your password regularly</li>
                                        <li>Enable two-factor authentication if available</li>
                                        <li>Log out after each session</li>
                                    </ul>
                                </div>
                                
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="#" class="cta-button">🚀 Access Trading Platform</a>
                                </div>
                            </div>
                            
                            <div class="footer">
                                <p><span class="highlight">Important:</span> If you didn't request these credentials, contact support immediately.</p>
                                <p>This is an automated message. Please do not reply to this email.</p>
                                <p style="margin-top: 20px; font-size: 12px; opacity: 0.7;">© 2025 Trading Platform. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
                attachments: [{
                    filename: 'logo.png',
                    path: LOGO_PATH,
                    cid: 'logo'
                }]
            };

            // Use queue system with rate limiting and retry logic
            const result = await this.queueEmail(mailOptions);

            console.log(`✅ Email sent successfully to ${emailID}`);
            console.log(`📧 Message ID: ${result.messageId}`);

            return {
                success: true,
                messageId: result.messageId,
                message: 'Trading credentials sent successfully'
            };

        } catch (error) {
            console.error(`❌ Failed to send email to ${emailID}:`, error);

            return {
                success: false,
                error: error.error || error.message,
                message: 'Failed to send trading credentials'
            };
        }
    }

    // Test email service
    async testEmailService() {
        try {
            const result = await this.transporter.verify();
            console.log('✅ Email service is ready');
            return { success: true, message: 'Email service is ready' };
        } catch (error) {
            console.error('❌ Email service test failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Get email service status
    getEmailServiceStatus() {
        return {
            service: 'gmail',
            user: process.env.EMAIL_USER ? 'Configured' : 'Not configured',
            appPassword: process.env.EMAIL_APP_PASSWORD ? 'Configured' : 'Not configured',
            queueLength: this.emailQueue.length,
            isProcessing: this.isProcessing,
            rateLimitConfig: {
                minDelayBetweenEmails: `${this.config.minDelayBetweenEmails}ms`,
                maxRetries: this.config.maxRetries,
                initialRetryDelay: `${this.config.initialRetryDelay}ms`,
                maxRetryDelay: `${this.config.maxRetryDelay}ms`
            }
        };
    }
}

// Export singleton instance
export const emailService = new EmailService();
