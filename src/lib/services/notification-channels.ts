/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */

export interface EmailMessage {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export interface SMSMessage {
    to: string;
    body: string;
}

export class EmailService {
    private apiKey: string;
    private fromEmail: string;
    private provider: 'sendgrid' | 'resend' | 'console';

    constructor() {
        // In production, these would come from environment variables
        this.apiKey = import.meta.env.VITE_EMAIL_API_KEY || '';
        this.fromEmail = import.meta.env.VITE_FROM_EMAIL || 'noreply@budgetmanager.app';
        this.provider = (import.meta.env.VITE_EMAIL_PROVIDER as 'sendgrid' | 'resend' | 'console') || 'console';
    }

    async sendEmail(message: EmailMessage): Promise<boolean> {
        try {
            switch (this.provider) {
                case 'sendgrid':
                    return await this.sendViaSendGrid(message);
                case 'resend':
                    return await this.sendViaResend(message);
                case 'console':
                default:
                    return await this.sendViaConsole(message);
            }
        } catch {
            return false;
        }
    }

    private async sendViaSendGrid(message: EmailMessage): Promise<boolean> {
        try {
            const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    personalizations: [{
                        to: [{ email: message.to }],
                        subject: message.subject,
                    }],
                    from: { email: this.fromEmail },
                    content: [
                        {
                            type: 'text/html',
                            value: message.html,
                        },
                    ],
                }),
            });

            return response.ok;
        } catch {
            return false;
        }
    }

    private async sendViaResend(message: EmailMessage): Promise<boolean> {
        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: this.fromEmail,
                    to: [message.to],
                    subject: message.subject,
                    html: message.html,
                    text: message.text,
                }),
            });

            return response.ok;
        } catch {
            return false;
        }
    }

    private async sendViaConsole(message: EmailMessage): Promise<boolean> {
        // For development - log to console
        console.log('📧 EMAIL WOULD BE SENT:', {
            to: message.to,
            subject: message.subject,
            html: message.html.substring(0, 200) + '...',
        });
        return true;
    }
}

export class SMSService {
    private apiKey: string;
    private accountSid: string;
    private fromNumber: string;
    private provider: 'twilio' | 'console';

    constructor() {
        // In production, these would come from environment variables
        this.apiKey = import.meta.env.VITE_TWILIO_API_KEY || '';
        this.accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID || '';
        this.fromNumber = import.meta.env.VITE_TWILIO_FROM_NUMBER || '';
        this.provider = (import.meta.env.VITE_SMS_PROVIDER as 'twilio' | 'console') || 'console';
    }

    async sendSMS(message: SMSMessage): Promise<boolean> {
        try {
            switch (this.provider) {
                case 'twilio':
                    return await this.sendViaTwilio(message);
                case 'console':
                default:
                    return await this.sendViaConsole(message);
            }
        } catch {
            return false;
        }
    }

    private async sendViaTwilio(message: SMSMessage): Promise<boolean> {
        try {
            const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${btoa(`${this.accountSid}:${this.apiKey}`)}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    From: this.fromNumber,
                    To: message.to,
                    Body: message.body,
                }),
            });

            const data = await response.json();
            return response.ok && data.status === 'queued';
        } catch {
            return false;
        }
    }

    private async sendViaConsole(message: SMSMessage): Promise<boolean> {
        // For development - log to console
        console.log('📱 SMS WOULD BE SENT:', {
            to: message.to,
            body: message.body,
        });
        return true;
    }
}

export class PushNotificationService {
    private vapidKey: string;
    private provider: 'web-push' | 'console';

    constructor() {
        // In production, these would come from environment variables
        this.vapidKey = import.meta.env.VITE_VAPID_KEY || '';
        this.provider = (import.meta.env.VITE_PUSH_PROVIDER as 'web-push' | 'console') || 'console';
    }

    async sendPushNotification(subscription: any, payload: any): Promise<boolean> {
        try {
            switch (this.provider) {
                case 'web-push':
                    return await this.sendViaWebPush(subscription, payload);
                case 'console':
                default:
                    return await this.sendViaConsole(payload);
            }
        } catch {
            return false;
        }
    }

    private async sendViaWebPush(subscription: any, payload: any): Promise<boolean> {
        try {
            const response = await fetch('/api/send-push', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscription,
                    payload,
                }),
            });

            return response.ok;
        } catch {
            return false;
        }
    }

    private async sendViaConsole(payload: any): Promise<boolean> {
        // For development - log to console
        console.log('🔔 PUSH NOTIFICATION WOULD BE SENT:', payload);
        return true;
    }
}