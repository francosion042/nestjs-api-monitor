"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackService = void 0;
const common_1 = require("@nestjs/common");
const injection_tokens_1 = require("../constants/injection-tokens");
const axios_1 = require("axios");
let SlackService = class SlackService {
    constructor(config) {
        this.config = config;
    }
    async sendAlert(errorModel) {
        var _a;
        if (!((_a = this.config.notifications.slack) === null || _a === void 0 ? void 0 : _a.enabled)) {
            return;
        }
        try {
            const message = this.formatSlackMessage(errorModel);
            await axios_1.default.post(this.config.notifications.slack.webhookUrl, message);
        }
        catch (error) {
            console.error("Failed to send Slack notification:", error);
        }
    }
    formatSlackMessage(errorModel) {
        var _a;
        const { error, request, response, metadata, aiSummary } = errorModel;
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
        if (error.stack && this.config.errorMonitoring.includeStackTrace) {
            blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*Stack Trace*\n\`\`\`${error.stack.slice(0, 2900)}\`\`\``,
                },
            });
        }
        if (aiSummary) {
            let summaryText = `*AI Analysis*\n${aiSummary.summary}`;
            if ((_a = aiSummary.possibleSolutions) === null || _a === void 0 ? void 0 : _a.length) {
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
        const color = error.statusCode >= 500
            ? "#FF0000"
            : error.statusCode >= 400
                ? "#FFA500"
                : "#36C5F0";
        return Object.assign(Object.assign(Object.assign(Object.assign({ blocks, attachments: [
                {
                    color,
                    blocks: [
                        {
                            type: "context",
                            elements: [
                                {
                                    type: "mrkdwn",
                                    text: `Sent by NestJS API Monitor | Status: ${error.statusCode} | ${new Date().toISOString()}`,
                                },
                            ],
                        },
                    ],
                },
            ] }, (this.config.notifications.slack.channel && {
            channel: this.config.notifications.slack.channel,
        })), (this.config.notifications.slack.username && {
            username: this.config.notifications.slack.username,
        })), (this.config.notifications.slack.iconEmoji && {
            icon_emoji: this.config.notifications.slack.iconEmoji,
        })), (this.config.notifications.slack.iconUrl && {
            icon_url: this.config.notifications.slack.iconUrl,
        }));
    }
};
exports.SlackService = SlackService;
exports.SlackService = SlackService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(injection_tokens_1.API_MONITOR_CONFIG)),
    __metadata("design:paramtypes", [Object])
], SlackService);
//# sourceMappingURL=slack.service.js.map