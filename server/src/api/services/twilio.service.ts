import axios from 'axios';

interface TwilioOTPResponse {
  sid: string;
  body: string;
  status: string;
  valid: boolean;
}

interface TwilioVerifyResponse {
  sid: string;
  status: string;
  valid: boolean;
}

class TwilioService {
  private accountSid: string;
  private authToken: string;
  private verifyServiceSid: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID as string;
    this.authToken = process.env.TWILIO_AUTH_TOKEN as string;
    this.verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID as string;

    if (!this.accountSid || !this.authToken || !this.verifyServiceSid) {
      throw new Error(
        'Twilio credentials are not set. Please define TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID in your environment.'
      );
    }
  }

  /**
   * Send OTP verification code to phone number
   * @param phoneNumber - Phone number in E.164 format (e.g., +1234567890)
   * @param channel - Channel type (sms or call)
   */
  async sendOTP(phoneNumber: string, channel: 'sms' | 'call' = 'sms'): Promise<TwilioOTPResponse> {
    try {
      const url = `https://verify.twilio.com/v2/Services/${this.verifyServiceSid}/Verifications`;

      const authString = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      // Normalize and validate phone number
      const normalized = this.formatPhoneNumber(phoneNumber);
      if (!this.validatePhoneNumber(normalized)) {
        throw new Error('Invalid phone number format. Please use E.164 format, e.g., +1234567890');
      }

      // Twilio Verify expects URL-encoded form data
      const params = new URLSearchParams();
      params.append('To', normalized);
      params.append('Channel', channel);

      const response = await axios.post(url, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${authString}`,
        },
      });

      return {
        sid: response.data.sid,
        body: response.data.body || '',
        status: response.data.status,
        valid: true
      };
    } catch (error) {
      console.error('Twilio OTP send error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const responseMessage = (error as any).response?.data?.message || errorMessage;
      throw new Error(`Failed to send OTP: ${responseMessage}`);
    }
  }

  /**
   * Verify OTP code
   * @param phoneNumber - Phone number in E.164 format
   * @param code - Verification code received by user
   */
  async verifyOTP(phoneNumber: string, code: string): Promise<TwilioVerifyResponse> {
    try {
      const url = `https://verify.twilio.com/v2/Services/${this.verifyServiceSid}/VerificationCheck`;

      const authString = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      // Normalize and validate phone number
      const normalized = this.formatPhoneNumber(phoneNumber);
      if (!this.validatePhoneNumber(normalized)) {
        throw new Error('Invalid phone number format. Please use E.164 format, e.g., +1234567890');
      }

      // Twilio Verify expects URL-encoded form data
      const params = new URLSearchParams();
      params.append('To', normalized);
      params.append('Code', code);

      const response = await axios.post(url, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${authString}`,
        },
      });

      return {
        sid: response.data.sid,
        status: response.data.status,
        valid: response.data.valid || response.data.status === 'approved'
      };
    } catch (error) {
      console.error('Twilio OTP verification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const responseMessage = (error as any).response?.data?.message || errorMessage;
      throw new Error(`Failed to verify OTP: ${responseMessage}`);
    }
  }

  /**
   * Format phone number to E.164 format
   * @param phoneNumber - Phone number in any format
   */
  formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.startsWith('00')) {
      return `+${cleaned.substring(2)}`;
    }
    
    if (cleaned.startsWith('+')) {
      return phoneNumber;
    }
    
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    
    return phoneNumber.startsWith('+') ? phoneNumber : `+${cleaned}`;
  }

  /**
   * Validate phone number format
   * @param phoneNumber - Phone number to validate
   */
  validatePhoneNumber(phoneNumber: string): boolean {    // Basic E.164 format validation
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }
}

export const twilioService = new TwilioService();
export default twilioService;
