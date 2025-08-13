// config/emailConfig.js
// Email service configuration

export const EmailConfig = {
    // Gmail configuration
    gmail: {
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD
        }
    },
    
    // Outlook/Hotmail configuration (alternative)
    outlook: {
        service: 'outlook',
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    },
    
    // Custom SMTP configuration
    custom: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    }
};

// Email templates
export const EmailTemplates = {
    tradingCredentials: {
        subject: 'Your Trading Credentials',
        subjectPrefix: '[Trading App] ',
        fromName: 'Trading Support',
        replyTo: process.env.SUPPORT_EMAIL || 'noreply@tradingapp.com'
    }
};

// Validation rules
export const ValidationRules = {
    email: {
        minLength: 5,
        maxLength: 254,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    tradingID: {
        minLength: 3,
        maxLength: 50,
        pattern: /^[a-zA-Z0-9_-]+$/
    },
    tradingPassword: {
        minLength: 6,
        maxLength: 100
    }
};

// Rate limiting configuration
export const RateLimitConfig = {
    maxRequestsPerHour: 10,
    maxRequestsPerDay: 50,
    windowMs: 60 * 60 * 1000, // 1 hour
    delayMs: 1000 // 1 second delay between requests
};
