import { Inject, Injectable } from "@nestjs/common";
import { API_MONITOR_CONFIG } from "../constants/injection-tokens";
import { ApiMonitorConfig } from "../interfaces/api-monitor-config.interface";
import { ApiErrorModel } from "../interfaces/error-model.interface";
import { Twilio } from "twilio";

@Injectable()
export class TwilioService {
  private client: Twilio;

  constructor(
    @Inject(API_MONITOR_CONFIG) private readonly config: ApiMonitorConfig
  ) {
    // Initialize the Twilio client if Twilio notifications are enabled
    if (this.config.notifications.twilio?.enabled) {
      this.client = new Twilio(
        this.config.notifications.twilio.accountSid,
        this.config.notifications.twilio.authToken
      );
    }
  }

  /**
   * Send an error alert via SMS
   */
  async sendSmsAlert(errorModel: ApiErrorModel): Promise<void> {
    if (
      !this.config.notifications.twilio?.enabled ||
      !this.client ||
      !this.config.notifications.twilio.sms
    ) {
      return;
    }

    try {
      const message = this.formatSmsMessage(errorModel);
      const from = this.config.notifications.twilio.sms.from;
      const to = this.config.notifications.twilio.sms.to;

      // Send SMS to all configured recipients
      await Promise.all(
        to.map((recipient) =>
          this.client.messages.create({
            body: message,
            from,
            to: recipient,
          })
        )
      );
    } catch (error) {
      console.error("Failed to send SMS notification:", error);
    }
  }

  /**
   * Send an error alert via WhatsApp
   */
  async sendWhatsAppAlert(errorModel: ApiErrorModel): Promise<void> {
    if (
      !this.config.notifications.twilio?.enabled ||
      !this.client ||
      !this.config.notifications.twilio.whatsapp
    ) {
      return;
    }

    try {
      const message = this.formatWhatsAppMessage(errorModel);
      const from = this.config.notifications.twilio.whatsapp.from;
      const to = this.config.notifications.twilio.whatsapp.to;

      // Send WhatsApp messages to all configured recipients
      await Promise.all(
        to.map((recipient) =>
          this.client.messages.create({
            body: message,
            from,
            to: recipient,
          })
        )
      );
    } catch (error) {
      console.error("Failed to send WhatsApp notification:", error);
    }
  }

  /**
   * Format an error model into an SMS message (must be concise due to SMS limits)
   */
  private formatSmsMessage(errorModel: ApiErrorModel): string {
    const { error, request, metadata, aiSummary } = errorModel;

    // Basic error information
    let message = `⚠️ API Error: ${error.statusCode} ${error.name}\n`;
    message += `Message: ${error.message}\n`;
    message += `Endpoint: ${request.method} ${request.url}\n`;
    message += `Time: ${new Date(error.timestamp).toLocaleString()}\n`;

    // Add environment info if available
    if (metadata?.environment) {
      message += `Env: ${metadata.environment}\n`;
    }

    // Add AI summary if available (but keep it brief for SMS)
    if (aiSummary?.summary) {
      message += `\nAI Analysis: ${aiSummary.summary.substring(0, 100)}${
        aiSummary.summary.length > 100 ? "..." : ""
      }\n`;
    }

    return message;
  }

  /**
   * Format an error model into a WhatsApp message (can be more detailed than SMS)
   */
  private formatWhatsAppMessage(errorModel: ApiErrorModel): string {
    const { error, request, metadata, aiSummary } = errorModel;

    // Basic error information
    let message = `*🚨 API Error: ${error.statusCode} ${error.name}*\n\n`;
    message += `*Error Message:* ${error.message}\n`;
    message += `*Endpoint:* ${request.method} ${request.url}\n`;
    message += `*Time:* ${new Date(error.timestamp).toLocaleString()}\n`;

    // Add environment info if available
    if (metadata) {
      message += `\n*Environment Information:*\n`;
      Object.entries(metadata).forEach(([key, value]) => {
        message += `- *${key}:* ${value}\n`;
      });
    }

    // Add AI summary if available
    if (aiSummary) {
      message += `\n*AI Analysis:*\n${aiSummary.summary}\n`;

      if (aiSummary.possibleSolutions?.length) {
        message += `\n*Possible Solutions:*\n`;
        aiSummary.possibleSolutions.forEach((solution, index) => {
          message += `${index + 1}. ${solution}\n`;
        });
      }
    }

    message += `\n_Sent by NestJS API Monitor_`;
    return message;
  }
}
