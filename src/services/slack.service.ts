import { Inject, Injectable } from "@nestjs/common";
import { API_MONITOR_CONFIG } from "../constants/injection-tokens";
import { ApiMonitorConfig } from "../interfaces/api-monitor-config.interface";
import { ApiErrorModel } from "../interfaces/error-model.interface";
import axios from "axios";

@Injectable()
export class SlackService {
  constructor(
    @Inject(API_MONITOR_CONFIG) private readonly config: ApiMonitorConfig
  ) {}

  /**
   * Send an error alert to Slack
   */
  async sendAlert(errorModel: ApiErrorModel): Promise<void> {
    if (!this.config.notifications.slack?.enabled) {
      return;
    }

    try {
      // Format the error message for Slack
      const message = this.formatSlackMessage(errorModel);

      // Send to Slack webhook
      await axios.post(this.config.notifications.slack.webhookUrl, message);
    } catch (error) {
      console.error("Failed to send Slack notification:", error);
    }
  }

  /**
   * Format an error model into a Slack message payload
   */
  private formatSlackMessage(errorModel: ApiErrorModel): any {
    const { error, request, response, metadata, aiSummary } = errorModel;

    // Format the error blocks
    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `🚨 API Error: ${error.statusCode} ${error.name}`,
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Error:* ${error.message}\n*Path:* \`${request.method} ${request.url}\`\n*Time:* ${error.timestamp}`,
        },
      },
      {
        type: "divider",
      },
    ];

    // Add metadata
    if (metadata) {
      const metadataText = Object.entries(metadata)
        .map(([key, value]) => `*${key}:* ${value}`)
        .join("\n");

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Environment Information*\n${metadataText}`,
        },
      });
    }

    // Add stack trace if available
    if (error.stack && this.config.errorMonitoring.includeStackTrace) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Stack Trace*\n\`\`\`${error.stack.slice(0, 2900)}\`\`\``,
        },
      });
    }

    // Add AI summary if available
    if (aiSummary) {
      let summaryText = `*AI Analysis*\n${aiSummary.summary}`;

      if (aiSummary.possibleSolutions?.length) {
        summaryText += "\n\n*Possible Solutions*:\n";
        summaryText += aiSummary.possibleSolutions
          .map((solution, index) => `${index + 1}. ${solution}`)
          .join("\n");
      }

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: summaryText,
        },
      });
    }

    // Define colors based on status code
    const color =
      error.statusCode >= 500
        ? "#FF0000" // Red for 5xx
        : error.statusCode >= 400
        ? "#FFA500" // Orange for 4xx
        : "#36C5F0"; // Blue for others

    return {
      blocks,
      attachments: [
        {
          color,
          blocks: [
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `Sent by NestJS API Monitor | Status: ${
                    error.statusCode
                  } | ${new Date().toISOString()}`,
                },
              ],
            },
          ],
        },
      ],
      // Add channel, username, and icon if specified
      ...(this.config.notifications.slack.channel && {
        channel: this.config.notifications.slack.channel,
      }),
      ...(this.config.notifications.slack.username && {
        username: this.config.notifications.slack.username,
      }),
      ...(this.config.notifications.slack.iconEmoji && {
        icon_emoji: this.config.notifications.slack.iconEmoji,
      }),
      ...(this.config.notifications.slack.iconUrl && {
        icon_url: this.config.notifications.slack.iconUrl,
      }),
    };
  }
}
