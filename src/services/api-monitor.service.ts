import { Inject, Injectable, Optional } from "@nestjs/common";
import { API_MONITOR_CONFIG } from "../constants/injection-tokens";
import { ApiMonitorConfig } from "../interfaces/api-monitor-config.interface";
import { SlackService } from "./slack.service";
import { EmailService } from "./email.service";
import { TwilioService } from "./twilio.service";
import { WebhookService } from "./webhook.service";
import { OpenAiService } from "./openai.service";
import {
  ApiErrorModel,
  ErrorDetails,
  RequestDetails,
} from "../interfaces/error-model.interface";

@Injectable()
export class ApiMonitorService {
  private errorHistory: ApiErrorModel[] = [];

  constructor(
    @Inject(API_MONITOR_CONFIG) private readonly config: ApiMonitorConfig,
    @Optional() private readonly slackService?: SlackService,
    @Optional() private readonly emailService?: EmailService,
    @Optional() private readonly twilioService?: TwilioService,
    @Optional() private readonly webhookService?: WebhookService,
    @Optional() private readonly openAiService?: OpenAiService
  ) {}

  /**
   * Process an API error and send notifications
   */
  async processError(
    error: ErrorDetails,
    request: RequestDetails,
    response?: { body?: any; statusCode: number }
  ): Promise<void> {
    // Create the error model
    const errorModel: ApiErrorModel = {
      error,
      request,
      response,
      metadata: {
        environment: process.env.NODE_ENV || "development",
        service: process.env.SERVICE_NAME || "api",
        version: process.env.APP_VERSION || "1.0.0",
      },
    };

    // Apply custom transformation if provided
    if (this.config.errorMonitoring.customErrorTransformer) {
      const transformed = this.config.errorMonitoring.customErrorTransformer(
        error,
        request,
        response
      );

      if (transformed) {
        Object.assign(errorModel, transformed);
      }
    }

    // Update error history for AI summarization context
    this.updateErrorHistory(errorModel);

    // Process with AI if enabled
    if (this.config.aiSummarization?.enabled && this.openAiService) {
      try {
        const aiSummary = await this.openAiService.analyzeError(
          errorModel,
          this.errorHistory
        );
        errorModel.aiSummary = aiSummary;
      } catch (aiError) {
        console.error("Failed to generate AI summary:", aiError);
      }
    }

    // Send notifications
    await this.sendNotifications(errorModel);
  }

  /**
   * Send notifications to all configured channels
   */
  private async sendNotifications(errorModel: ApiErrorModel): Promise<void> {
    const promises: Promise<any>[] = [];

    // Send to Slack if enabled
    if (this.config.notifications.slack?.enabled && this.slackService) {
      promises.push(this.slackService.sendAlert(errorModel));
    }

    // Send via email if enabled
    if (this.config.notifications.email?.enabled && this.emailService) {
      promises.push(this.emailService.sendAlert(errorModel));
    }

    // Send via SMS/WhatsApp if enabled
    if (this.config.notifications.twilio?.enabled && this.twilioService) {
      if (this.config.notifications.twilio.sms) {
        promises.push(this.twilioService.sendSmsAlert(errorModel));
      }

      if (this.config.notifications.twilio.whatsapp) {
        promises.push(this.twilioService.sendWhatsAppAlert(errorModel));
      }
    }

    // Send via webhook if enabled
    if (this.config.notifications.webhook?.enabled && this.webhookService) {
      promises.push(this.webhookService.sendAlert(errorModel));
    }

    // Wait for all notifications to be sent
    if (promises.length > 0) {
      try {
        await Promise.all(promises);
      } catch (error) {
        console.error("Failed to send notifications:", error);
      }
    }
  }

  /**
   * Update the error history for AI context
   */
  private updateErrorHistory(errorModel: ApiErrorModel): void {
    // Add to error history
    this.errorHistory.push(errorModel);

    // Trim history if it exceeds the configured maximum
    const maxHistory = this.config.aiSummarization?.maxHistoryLength || 5;
    if (this.errorHistory.length > maxHistory) {
      this.errorHistory = this.errorHistory.slice(-maxHistory);
    }
  }
}
