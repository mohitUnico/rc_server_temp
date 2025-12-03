import sgMail from '@sendgrid/mail';
import fs from 'fs';
import { LOGO_PATH, FROM_EMAIL, SENDGRID_API_KEY } from '../config/envConfig.js';

export class EmailService {
    constructor() {
        // Initialize SendGrid
        sgMail.setApiKey(SENDGRID_API_KEY);

        console.log('✅ SendGrid Email Service initialized');
        console.log(`📧 From Email: ${FROM_EMAIL}`);

        // Rate limiting configuration
        this.emailQueue = [];
        this.isProcessing = false;
        this.lastEmailTime = 0;

        // Configure rate limiting (still useful with SendGrid to avoid abuse)
        this.config = {
            minDelayBetweenEmails: parseInt(process.env.EMAIL_MIN_DELAY) || 1000, // 1 second between emails
            maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES) || 3,
            initialRetryDelay: parseInt(process.env.EMAIL_INITIAL_RETRY_DELAY) || 2000, // 2 seconds
            maxRetryDelay: parseInt(process.env.EMAIL_MAX_RETRY_DELAY) || 30000, // 30 seconds
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
                // Try to send the email via SendGrid
                const response = await sgMail.send(emailOptions);
                this.lastEmailTime = Date.now();

                const messageId =
                    response?.[0]?.headers?.['x-message-id'] ||
                    response?.[0]?.headers?.['X-Message-Id'] ||
                    'sent';

                resolve({
                    success: true,
                    messageId,
                    message: 'Email sent successfully'
                });
            } catch (error) {
                // Handle rate limit errors (429) with exponential backoff
                const statusCode = error.code || error.response?.statusCode;
                const errorMessage =
                    error.response?.body?.errors?.[0]?.message ||
                    error.message ||
                    'Unknown SendGrid error';

                if (statusCode === 429 || errorMessage.includes('rate limit') || errorMessage.includes('429')) {
                    if (retries < this.config.maxRetries) {
                        const retryDelay = Math.min(
                            this.config.initialRetryDelay * Math.pow(2, retries),
                            this.config.maxRetryDelay
                        );

                        console.log(`⚠️ SendGrid rate limit hit (429). Retry ${retries + 1}/${this.config.maxRetries} after ${retryDelay}ms`);

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
                            originalError: errorMessage
                        });
                    }
                } else {
                    // Other errors
                    console.error('❌ SendGrid email send error:', error);
                    reject({
                        success: false,
                        error: errorMessage
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

    /**
     * Send a custom HTML email.
     * 
     * This is intended for use by clients (e.g. Flutter) that already have
     * a fully rendered HTML template and just need the backend to deliver it.
     * 
     * @param {string} toEmail - Recipient email address
     * @param {string} subject - Email subject
     * @param {string} htmlContent - Full HTML body to send
     * @returns {Promise<{success: boolean, messageId?: string, message: string, error?: string}>}
     */
    async sendCustomHtmlEmail(toEmail, subject, htmlContent) {
        try {
            if (!SENDGRID_API_KEY) {
                throw new Error('SENDGRID_API_KEY not configured');
            }

            if (!FROM_EMAIL) {
                throw new Error('FROM_EMAIL not configured');
            }

            if (!toEmail || !htmlContent) {
                throw new Error('toEmail and html content are required');
            }

            // Basic sanity limit to avoid abuse / huge payloads
            if (htmlContent.length > 100000) { // ~100 KB
                throw new Error('HTML content too large');
            }

            const mailOptions = {
                to: toEmail,
                from: FROM_EMAIL,
                subject: subject || 'Notification',
                html: htmlContent
            };

            const result = await this.queueEmail(mailOptions);

            console.log(`✅ Custom HTML email sent successfully to ${toEmail}`);
            console.log(`📧 Message ID: ${result.messageId}`);

            return {
                success: true,
                messageId: result.messageId,
                message: 'Email sent successfully'
            };

        } catch (error) {
            console.error(`❌ Failed to send custom HTML email to ${toEmail}:`, error);

            return {
                success: false,
                error: error.error || error.message,
                message: 'Failed to send email'
            };
        }
    }

    // Send trading credentials via email (with rate limiting, queue, and SendGrid)
    async sendTradingCredentials(emailID, tradingID, tradingPassword) {
        try {
            // Read and encode logo for SendGrid attachment (optional)
            let logoBase64 = '';
            try {
                const logoBuffer = fs.readFileSync(LOGO_PATH);
                logoBase64 = logoBuffer.toString('base64');
            } catch (logoError) {
                console.warn('⚠️ Could not read logo file, sending email without logo. Path:', LOGO_PATH);
            }

            // Simple HTML template for trading credentials (kept minimal,
            // since rich templates can now be provided by clients via sendCustomHtmlEmail).
            const mailOptions = {
                to: emailID,
                from: FROM_EMAIL,
                subject: 'Your Trading Credentials',
                html: `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                      <meta charset="UTF-8" />
                      <title>Trading Credentials</title>
                    </head>
                    <body>
                      <h2>Your Trading Credentials</h2>
                      <p>Trading ID: <strong>${tradingID}</strong></p>
                      <p>Trading Password: <strong>${tradingPassword}</strong></p>
                      <p>Please keep these credentials safe and do not share them with anyone.</p>
                    </body>
                    </html>
                `
            };

            // Add inline logo attachment for SendGrid if available
            if (logoBase64) {
                mailOptions.attachments = [
                    {
                        content: logoBase64,
                        filename: 'logo.png',
                        type: 'image/png',
                        disposition: 'inline',
                        content_id: 'logo'
                    }
                ];
            }

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

    // Test email service (basic configuration check for SendGrid)
    async testEmailService() {
        try {
            if (!SENDGRID_API_KEY) {
                throw new Error('SENDGRID_API_KEY not configured');
            }
            if (!FROM_EMAIL) {
                throw new Error('FROM_EMAIL not configured');
            }

            console.log('✅ SendGrid email service configuration looks valid');
            return {
                success: true,
                message: 'SendGrid email service configuration looks valid',
                provider: 'SendGrid',
                fromEmail: FROM_EMAIL
            };
        } catch (error) {
            console.error('❌ SendGrid email service test failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Get email service status
    getEmailServiceStatus() {
        return {
            service: 'SendGrid',
            provider: 'SendGrid',
            apiKey: SENDGRID_API_KEY ? 'Configured' : 'Not configured',
            fromEmail: FROM_EMAIL || 'Not configured',
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
