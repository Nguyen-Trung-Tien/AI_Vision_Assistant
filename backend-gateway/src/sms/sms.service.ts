import { Injectable, Logger } from '@nestjs/common';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: Twilio;
  private readonly twilioPhone: string;
  private readonly isDev: boolean;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    const authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.twilioPhone = process.env.TWILIO_PHONE_NUMBER || '';

    // Use mock service if credentials aren't provided
    if (!accountSid || !authToken || !this.twilioPhone) {
      this.logger.warn('Twilio credentials missing. Falling back to mock SMS logging.');
      this.isDev = true;
    } else {
      this.twilioClient = new Twilio(accountSid, authToken);
      this.isDev = false;
    }
  }

  async sendSOS(phone: string, userName: string, lat: number, lng: number): Promise<boolean> {
    const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}`;
    const messageBody = `[KHẨN CẤP] ${userName} đang cần trợ giúp! Vị trí ước tính: ${mapUrl} - Lúc: ${new Date().toLocaleString('vi-VN')}`;

    if (this.isDev) {
      this.logger.log(`[MOCK SMS] To: ${phone} | Body: ${messageBody}`);
      return true;
    }

    try {
      const message = await this.twilioClient.messages.create({
        body: messageBody,
        from: this.twilioPhone,
        to: phone,
      });
      this.logger.log(`[SMS SENT] ID: ${message.sid} to ${phone}`);
      return true;
    } catch (error) {
      this.logger.error(`[SMS ERROR] Failed to send SMS to ${phone}`, error);
      return false;
    }
  }
}
