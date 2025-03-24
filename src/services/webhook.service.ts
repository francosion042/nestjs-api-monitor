import { Inject, Injectable } from '@nestjs/common';
import { API_MONITOR_CONFIG } from '../constants/injection-tokens';
import { ApiMonitorConfig } from '../interfaces/api-monitor-config.interface';
import { ApiErrorModel } from '../interfaces/error-model.interface';
import axios from 'axios';

@Injectable()
export class WebhookService {
  constructor(
    @Inject(API_MONITOR_CONFIG) private readonly config: ApiMonitorConfig,
  ) {}

  /**
   * Send an error alert via webhook
   */
  async sendAlert(errorModel: ApiErrorModel): Promise<void> {
    if (!this.config.notifications.webhook?.enabled) {
      return;
    }

    try {
      const webhookConfig = this.config.notifications.webhook;
      const method = webhookConfig.method?.toLowerCase() || 'post';
      const url = webhookConfig.url;
      const headers = webhookConfig.headers || {};

      // Format the payload
      const payload = this.formatWebhookPayload(errorModel);

      // Send via appropriate HTTP method
      switch (method) {
        case 'get':
          await axios.get(url, { headers, params: payload });
          break;
        case 'post':
          await axios.post(url, payload, { headers });
          break;
        case 'put':
          await axios.put(url, payload, { headers });
          break;
        case 'patch':
          await axios.patch(url, payload, { headers });
          break;
        case 'delete':
          await axios.delete(url, { headers, data: payload });
          break;
        default:
          await axios.post(url, payload, { headers });
      }
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }

  /**
   * Format an error model into a webhook payload
   */
  private formatWebhookPayload(errorModel: ApiErrorModel): any {
    const { error, request, response, metadata, aiSummary } = errorModel;

    // Basic webhook payload structure with types that match the expected properties
    const payload: Record<string, any> = {
      error: {
        name: error.name,
        message: error.message,
        statusCode: error.statusCode,
        path: error.path || request.url,
        timestamp: error.timestamp,
      },
      request: {
        method: request.method,
        url: request.url,
        timestamp: request.timestamp,
      },
      metadata: metadata || {
        environment: process.env.NODE_ENV || 'development',
      },
    };

    // Add optional fields if they exist
    if (request.ip) {
      payload.request.ip = request.ip;
    }

    // Add stack trace if enabled
    if (error.stack && this.config.errorMonitoring.includeStackTrace) {
      payload.error.stack = error.stack;
    }

    // Add request details if enabled
    if (this.config.errorMonitoring.includeRequestBody && request.body) {
      payload.request.body = request.body;
    }

    if (this.config.errorMonitoring.includeHeaders && request.headers) {
      payload.request.headers = request.headers;
    }

    if (request.params && Object.keys(request.params).length > 0) {
      payload.request.params = request.params;
    }

    if (request.query && Object.keys(request.query).length > 0) {
      payload.request.query = request.query;
    }

    // Add response details if enabled and available
    if (response) {
      payload.response = {
        statusCode: response.statusCode,
      };

      if (this.config.errorMonitoring.includeResponseBody && response.body) {
        payload.response.body = response.body;
      }
    }

    // Add AI summary if available
    if (aiSummary) {
      payload.aiSummary = aiSummary;
    }

    return payload;
  }
} 