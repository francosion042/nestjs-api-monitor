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
exports.TwilioService = void 0;
const common_1 = require("@nestjs/common");
const injection_tokens_1 = require("../constants/injection-tokens");
const twilio_1 = require("twilio");
let TwilioService = class TwilioService {
    constructor(config) {
        var _a;
        this.config = config;
        if ((_a = this.config.notifications.twilio) === null || _a === void 0 ? void 0 : _a.enabled) {
            this.client = new twilio_1.Twilio(this.config.notifications.twilio.accountSid, this.config.notifications.twilio.authToken);
        }
    }
    async sendSmsAlert(errorModel) {
        var _a;
        if (!((_a = this.config.notifications.twilio) === null || _a === void 0 ? void 0 : _a.enabled) ||
            !this.client ||
            !this.config.notifications.twilio.sms) {
            return;
        }
        try {
            const message = this.formatSmsMessage(errorModel);
            const from = this.config.notifications.twilio.sms.from;
            const to = this.config.notifications.twilio.sms.to;
            await Promise.all(to.map((recipient) => this.client.messages.create({
                body: message,
                from,
                to: recipient,
            })));
        }
        catch (error) {
            console.error("Failed to send SMS notification:", error);
        }
    }
    async sendWhatsAppAlert(errorModel) {
        var _a;
        if (!((_a = this.config.notifications.twilio) === null || _a === void 0 ? void 0 : _a.enabled) ||
            !this.client ||
            !this.config.notifications.twilio.whatsapp) {
            return;
        }
        try {
            const message = this.formatWhatsAppMessage(errorModel);
            const from = this.config.notifications.twilio.whatsapp.from;
            const to = this.config.notifications.twilio.whatsapp.to;
            await Promise.all(to.map((recipient) => this.client.messages.create({
                body: message,
                from,
                to: recipient,
            })));
        }
        catch (error) {
            console.error("Failed to send WhatsApp notification:", error);
        }
    }
    formatSmsMessage(errorModel) {
        const { error, request, metadata, aiSummary } = errorModel;
        let message = `⚠️ API Error: ${error.statusCode} ${error.name}\n`;
        message += `Message: ${error.message}\n`;
        message += `Endpoint: ${request.method} ${request.url}\n`;
        message += `Time: ${new Date(error.timestamp).toLocaleString()}\n`;
        if (metadata === null || metadata === void 0 ? void 0 : metadata.environment) {
            message += `Env: ${metadata.environment}\n`;
        }
        if (aiSummary === null || aiSummary === void 0 ? void 0 : aiSummary.summary) {
            message += `\nAI Analysis: ${aiSummary.summary.substring(0, 100)}${aiSummary.summary.length > 100 ? "..." : ""}\n`;
        }
        return message;
    }
    formatWhatsAppMessage(errorModel) {
        var _a;
        const { error, request, metadata, aiSummary } = errorModel;
        let message = `*🚨 API Error: ${error.statusCode} ${error.name}*\n\n`;
        message += `*Error Message:* ${error.message}\n`;
        message += `*Endpoint:* ${request.method} ${request.url}\n`;
        message += `*Time:* ${new Date(error.timestamp).toLocaleString()}\n`;
        if (metadata) {
            message += `\n*Environment Information:*\n`;
            Object.entries(metadata).forEach(([key, value]) => {
                message += `- *${key}:* ${value}\n`;
            });
        }
        if (aiSummary) {
            message += `\n*AI Analysis:*\n${aiSummary.summary}\n`;
            if ((_a = aiSummary.possibleSolutions) === null || _a === void 0 ? void 0 : _a.length) {
                message += `\n*Possible Solutions:*\n`;
                aiSummary.possibleSolutions.forEach((solution, index) => {
                    message += `${index + 1}. ${solution}\n`;
                });
            }
        }
        message += `\n_Sent by NestJS API Monitor_`;
        return message;
    }
};
exports.TwilioService = TwilioService;
exports.TwilioService = TwilioService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(injection_tokens_1.API_MONITOR_CONFIG)),
    __metadata("design:paramtypes", [Object])
], TwilioService);
//# sourceMappingURL=twilio.service.js.map