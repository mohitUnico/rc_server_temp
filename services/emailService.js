import nodemailer from 'nodemailer';

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
    }

    // Send trading credentials via email
    async sendTradingCredentials(emailID, tradingID, tradingPassword) {
        try {
            // Email template
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: emailID,
                subject: 'Your Trading Credentials',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">🔐 Trading Credentials</h2>
                            
                            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                                <h3 style="color: #495057; margin-top: 0;">Your Account Information</h3>
                                
                                <div style="margin-bottom: 15px;">
                                    <strong style="color: #495057;">Trading ID:</strong>
                                    <span style="color: #6c757d; margin-left: 10px; font-family: monospace; background-color: #e9ecef; padding: 5px 10px; border-radius: 4px;">${tradingID}</span>
                                </div>
                                
                                <div style="margin-bottom: 15px;">
                                    <strong style="color: #495057;">Trading Password:</strong>
                                    <span style="color: #6c757d; margin-left: 10px; font-family: monospace; background-color: #e9ecef; padding: 5px 10px; border-radius: 4px;">${tradingPassword}</span>
                                </div>
                            </div>
                            
                            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                                <h4 style="color: #856404; margin-top: 0;">⚠️ Security Notice</h4>
                                <p style="color: #856404; margin: 0; font-size: 14px;">
                                    • Keep your credentials secure and confidential<br>
                                    • Never share your password with anyone<br>
                                    • Change your password regularly<br>
                                    • Enable two-factor authentication if available
                                </p>
                            </div>
                            
                            <div style="text-align: center; color: #6c757d; font-size: 14px;">
                                <p>If you didn't request these credentials, please contact support immediately.</p>
                                <p>This is an automated message. Please do not reply to this email.</p>
                            </div>
                        </div>
                    </div>
                `
            };

            // Send email
            const info = await this.transporter.sendMail(mailOptions);

            console.log(`✅ Email sent successfully to ${emailID}`);
            console.log(`📧 Message ID: ${info.messageId}`);

            return {
                success: true,
                messageId: info.messageId,
                message: 'Trading credentials sent successfully'
            };

        } catch (error) {
            console.error(`❌ Failed to send email to ${emailID}:`, error);

            return {
                success: false,
                error: error.message,
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
            appPassword: process.env.EMAIL_APP_PASSWORD ? 'Configured' : 'Not configured'
        };
    }
}

// Export singleton instance
export const emailService = new EmailService();
