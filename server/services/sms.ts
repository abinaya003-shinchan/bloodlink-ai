/**
 * SMS Provider Service for BloodLink AI
 * Implements real emergency SMS delivery abstraction using standard SMS provider APIs.
 *
 * Environment variables:
 * - SMS_PROVIDER_API_KEY: Provider authentication token or API key
 * - SMS_PROVIDER_SENDER_ID: Sender ID / Phone number (e.g. 'BLDLNK' or '+1234567890')
 * - SMS_PROVIDER_BASE_URL: Custom gateway URL (optional)
 * - SMS_PROVIDER_ACCOUNT_SID: Twilio Account SID (if using Twilio)
 * - APP_URL: Base URL of BloodLink AI applet (e.g. 'http://localhost:3000')
 */

export interface EmergencySmsPayload {
  recipientPhone: string;
  donorId: string;
  donorName: string;
  bloodRequestId: string;
  requiredBloodGroup: string;
  unitsRequired: number;
  hospitalName: string;
  district?: string;
  urgency: string;
  preferredLanguage?: 'en' | 'ta';
}

export interface SmsDeliveryResult {
  status: 'SENT' | 'FAILED' | 'NOT_CONFIGURED';
  messageId?: string;
  error?: string;
  sentAt?: string;
  messageBody: string;
  responseUrl: string;
  recipientPhone: string;
}

export class SmsService {
  private apiKey: string | undefined;
  private senderId: string;
  private baseUrl: string | undefined;
  private accountSid: string | undefined;
  private appUrl: string;

  constructor() {
    this.apiKey = process.env.SMS_PROVIDER_API_KEY;
    this.senderId = process.env.SMS_PROVIDER_SENDER_ID || 'BLDLNK';
    this.baseUrl = process.env.SMS_PROVIDER_BASE_URL;
    this.accountSid = process.env.SMS_PROVIDER_ACCOUNT_SID;
    this.appUrl = process.env.APP_URL || 'http://localhost:3000';
  }

  /**
   * Refreshes environment configurations on call
   */
  private getEnvConfig() {
    return {
      apiKey: process.env.SMS_PROVIDER_API_KEY,
      senderId: process.env.SMS_PROVIDER_SENDER_ID || 'BLDLNK',
      baseUrl: process.env.SMS_PROVIDER_BASE_URL,
      accountSid: process.env.SMS_PROVIDER_ACCOUNT_SID,
      appUrl: process.env.APP_URL || 'http://localhost:3000',
    };
  }

  /**
   * Generates secure response link for donor
   */
  public generateResponseLink(bloodRequestId: string, donorId: string): string {
    const config = this.getEnvConfig();
    const cleanBase = config.appUrl.replace(/\/+$/, '');
    return `${cleanBase}/respond/${bloodRequestId}/${donorId}`;
  }

  /**
   * Formats the emergency SMS body with blood group, hospital, district, and response link
   */
  public formatEmergencyMessage(payload: EmergencySmsPayload, responseUrl: string): string {
    const lang = payload.preferredLanguage || 'en';
    const districtText = payload.district ? `(${payload.district})` : '';

    if (lang === 'ta') {
      return (
        `[அவசரம்] பிளட்லிங்க் AI இரத்த எச்சரிக்கை: ${payload.hospitalName} ${districtText} மருத்துவமனைக்கு ` +
        `${payload.requiredBloodGroup} வகை இரத்தம் (${payload.unitsRequired} யூனிட்) அவசரமாக தேவைப்படுகிறது. ` +
        `தானம் செய்ய உங்கள் ஒப்புதலைத் தெரிவிக்க: ${responseUrl}`
      );
    }

    return (
      `[EMERGENCY] BloodLink AI Alert: ${payload.hospitalName} ${districtText} urgently requires ` +
      `${payload.requiredBloodGroup} blood (${payload.unitsRequired} units). ` +
      `You are an eligible matching donor. Please respond here: ${responseUrl}`
    );
  }

  /**
   * Sends a real SMS notification through the configured provider API
   */
  public async sendEmergencySms(payload: EmergencySmsPayload): Promise<SmsDeliveryResult> {
    const config = this.getEnvConfig();
    const responseUrl = this.generateResponseLink(payload.bloodRequestId, payload.donorId);
    const messageBody = this.formatEmergencyMessage(payload, responseUrl);
    const recipientPhone = payload.recipientPhone.trim();

    // 1. Check if provider credentials are configured
    if (!config.apiKey || config.apiKey.trim() === '' || config.apiKey === 'MY_SMS_PROVIDER_API_KEY') {
      return {
        status: 'NOT_CONFIGURED',
        error: 'SMS provider not configured (Missing SMS_PROVIDER_API_KEY in environment variables).',
        messageBody,
        responseUrl,
        recipientPhone,
      };
    }

    // 2. Validate recipient phone number format
    const cleanedDigits = recipientPhone.replace(/[^0-9]/g, '');
    if (cleanedDigits.length < 10) {
      return {
        status: 'FAILED',
        error: `Invalid recipient phone number format: "${recipientPhone}".`,
        messageBody,
        responseUrl,
        recipientPhone,
      };
    }

    // 3. Attempt delivery via configured provider
    try {
      // Option A: Twilio REST API
      if (config.accountSid) {
        const twilioUrl =
          config.baseUrl ||
          `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;

        const authHeader = Buffer.from(`${config.accountSid}:${config.apiKey}`).toString('base64');
        const formParams = new URLSearchParams();
        formParams.set('To', recipientPhone.startsWith('+') ? recipientPhone : `+91${recipientPhone}`);
        formParams.set('From', config.senderId);
        formParams.set('Body', messageBody);

        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formParams.toString(),
        });

        if (!response.ok) {
          const errData = await response.text();
          return {
            status: 'FAILED',
            error: `Twilio delivery error (${response.status}): ${errData}`,
            messageBody,
            responseUrl,
            recipientPhone,
          };
        }

        const data = await response.json();
        return {
          status: 'SENT',
          messageId: data.sid || `TW-${Date.now()}`,
          sentAt: new Date().toISOString(),
          messageBody,
          responseUrl,
          recipientPhone,
        };
      }

      // Option B: Fast2SMS / Indian Gateway
      if (!config.baseUrl || config.baseUrl.includes('fast2sms')) {
        const gatewayUrl = config.baseUrl || 'https://www.fast2sms.com/dev/bulkV2';
        const formattedNumber = cleanedDigits.length === 10 ? cleanedDigits : cleanedDigits.slice(-10);

        const response = await fetch(gatewayUrl, {
          method: 'POST',
          headers: {
            authorization: config.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'q',
            message: messageBody,
            flash: 0,
            numbers: formattedNumber,
          }),
        });

        if (!response.ok) {
          const errData = await response.text();
          return {
            status: 'FAILED',
            error: `SMS Gateway error (${response.status}): ${errData}`,
            messageBody,
            responseUrl,
            recipientPhone,
          };
        }

        const data = await response.json().catch(() => ({}));
        return {
          status: 'SENT',
          messageId: data.request_id || `SMS-${Date.now()}`,
          sentAt: new Date().toISOString(),
          messageBody,
          responseUrl,
          recipientPhone,
        };
      }

      // Option C: Generic REST Webhook Gateway
      const response = await fetch(config.baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipientPhone,
          from: config.senderId,
          message: messageBody,
          requestId: payload.bloodRequestId,
          donorId: payload.donorId,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return {
          status: 'FAILED',
          error: `Generic SMS provider returned HTTP ${response.status}: ${errText}`,
          messageBody,
          responseUrl,
          recipientPhone,
        };
      }

      const resJson = await response.json().catch(() => ({}));
      return {
        status: 'SENT',
        messageId: resJson.id || resJson.messageId || `GEN-${Date.now()}`,
        sentAt: new Date().toISOString(),
        messageBody,
        responseUrl,
        recipientPhone,
      };
    } catch (err: any) {
      return {
        status: 'FAILED',
        error: `Network or SMS dispatch error: ${err.message || 'Unknown network error'}`,
        messageBody,
        responseUrl,
        recipientPhone,
      };
    }
  }
}

export const smsService = new SmsService();
