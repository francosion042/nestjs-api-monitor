import { Inject, Injectable } from "@nestjs/common";
import { API_MONITOR_CONFIG } from "../constants/injection-tokens";
import { ApiMonitorConfig } from "../interfaces/api-monitor-config.interface";
import { ApiErrorModel } from "../interfaces/error-model.interface";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    @Inject(API_MONITOR_CONFIG) private readonly config: ApiMonitorConfig
  ) {
    // Initialize the email transporter if email notifications are enabled
    if (this.config.notifications.email?.enabled) {
      this.transporter = nodemailer.createTransport({
        host: this.config.notifications.email.smtp.host,
        port: this.config.notifications.email.smtp.port,
        secure: this.config.notifications.email.smtp.secure || false,
        auth: {
          user: this.config.notifications.email.smtp.auth.user,
          pass: this.config.notifications.email.smtp.auth.pass,
        },
      });
    }
  }

  /**
   * Send an error alert via email
   */
  async sendAlert(errorModel: ApiErrorModel): Promise<void> {
    if (!this.config.notifications.email?.enabled || !this.transporter) {
      return;
    }

    try {
      const { subject, html } = this.formatEmailMessage(errorModel);

      await this.transporter.sendMail({
        from: this.config.notifications.email.from,
        to: this.config.notifications.email.to,
        cc: this.config.notifications.email.cc,
        subject,
        html,
      });
    } catch (error) {
      console.error("Failed to send email notification:", error);
    }
  }

  /**
   * Format an error model into an email message
   */
  private formatEmailMessage(errorModel: ApiErrorModel): {
    subject: string;
    html: string;
  } {
    const { error, request, response, metadata, aiSummary } = errorModel;

    // Create the subject line
    const subject =
      this.config.notifications.email?.subject ||
      `[${metadata?.environment || "PROD"}] API Error: ${error.statusCode} - ${
        error.name
      }`;

    // Create the HTML email body
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h1 style="color: #d32f2f; margin-bottom: 20px;">API Error: ${error.statusCode} ${error.name}</h1>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p><strong>Error Message:</strong> ${error.message}</p>
          <p><strong>Time:</strong> ${error.timestamp}</p>
          <p><strong>Endpoint:</strong> ${request.method} ${request.url}</p>
          <p><strong>Status Code:</strong> ${error.statusCode}</p>
        </div>

        <!-- Environment Information -->
        <h2 style="color: #333; margin-top: 30px;">Environment Information</h2>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
    `;

    // Add metadata if available
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        html += `<p><strong>${key}:</strong> ${value}</p>`;
      });
    }

    html += `</div>`;

    // Add request information
    html += `
      <h2 style="color: #333; margin-top: 30px;">Request Details</h2>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <p><strong>Method:</strong> ${request.method}</p>
        <p><strong>URL:</strong> ${request.url}</p>
        <p><strong>Timestamp:</strong> ${request.timestamp}</p>
    `;

    // Add request parameters if available
    if (request.params && Object.keys(request.params).length > 0) {
      html += `<p><strong>Parameters:</strong> ${JSON.stringify(
        request.params,
        null,
        2
      )}</p>`;
    }

    // Add request query if available
    if (request.query && Object.keys(request.query).length > 0) {
      html += `<p><strong>Query:</strong> ${JSON.stringify(
        request.query,
        null,
        2
      )}</p>`;
    }

    // Add request body if available and configured
    if (request.body && this.config.errorMonitoring.includeRequestBody) {
      html += `
        <p><strong>Request Body:</strong></p>
        <pre style="background-color: #eee; padding: 10px; border-radius: 5px; overflow-x: auto;">
          ${JSON.stringify(request.body, null, 2)}
        </pre>
      `;
    }

    html += `</div>`;

    // Add response information if available
    if (response) {
      html += `
        <h2 style="color: #333; margin-top: 30px;">Response Details</h2>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p><strong>Status Code:</strong> ${response.statusCode}</p>
      `;

      // Add response body if available and configured
      if (response.body && this.config.errorMonitoring.includeResponseBody) {
        html += `
          <p><strong>Response Body:</strong></p>
          <pre style="background-color: #eee; padding: 10px; border-radius: 5px; overflow-x: auto;">
            ${JSON.stringify(response.body, null, 2)}
          </pre>
        `;
      }

      html += `</div>`;
    }

    // Add stack trace if available and configured
    if (error.stack && this.config.errorMonitoring.includeStackTrace) {
      html += `
        <h2 style="color: #333; margin-top: 30px;">Stack Trace</h2>
        <pre style="background-color: #eee; padding: 10px; border-radius: 5px; overflow-x: auto; margin-bottom: 20px; white-space: pre-wrap;">
          ${error.stack}
        </pre>
      `;
    }

    // Add AI summary if available
    if (aiSummary) {
      html += `
        <h2 style="color: #333; margin-top: 30px;">AI Analysis</h2>
        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p>${aiSummary.summary}</p>
      `;

      if (aiSummary.possibleSolutions?.length) {
        html += `<h3 style="margin-top: 15px;">Possible Solutions:</h3><ul>`;
        aiSummary.possibleSolutions.forEach((solution) => {
          html += `<li>${solution}</li>`;
        });
        html += `</ul>`;
      }

      if (aiSummary.confidence) {
        let confidenceColor = "#4caf50"; // Green for high
        if (aiSummary.confidence === "medium") {
          confidenceColor = "#ff9800"; // Orange for medium
        } else if (aiSummary.confidence === "low") {
          confidenceColor = "#f44336"; // Red for low
        }

        html += `
          <p style="margin-top: 15px;">
            <strong>Confidence:</strong> 
            <span style="color: ${confidenceColor};">${aiSummary.confidence.toUpperCase()}</span>
          </p>
        `;
      }

      html += `</div>`;
    }

    // Close the main div
    html += `
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
          <p>This is an automated alert from the NestJS API Monitor.</p>
        </div>
      </div>
    `;

    return { subject, html };
  }
}
