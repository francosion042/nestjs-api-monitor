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
exports.ApiMonitorService = void 0;
const common_1 = require("@nestjs/common");
const injection_tokens_1 = require("../constants/injection-tokens");
const slack_service_1 = require("./slack.service");
const email_service_1 = require("./email.service");
const twilio_service_1 = require("./twilio.service");
const webhook_service_1 = require("./webhook.service");
const openai_service_1 = require("./openai.service");
let ApiMonitorService = class ApiMonitorService {
    constructor(config, slackService, emailService, twilioService, webhookService, openAiService) {
        this.config = config;
        this.slackService = slackService;
        this.emailService = emailService;
        this.twilioService = twilioService;
        this.webhookService = webhookService;
        this.openAiService = openAiService;
        this.errorHistory = [];
    }
    async processError(error, request, response) {
        var _a;
        const errorModel = {
            error,
            request,
            response,
            metadata: {
                environment: process.env.NODE_ENV || "development",
                service: process.env.SERVICE_NAME || "api",
                version: process.env.APP_VERSION || "1.0.0",
            },
        };
        if (this.config.errorMonitoring.customErrorTransformer) {
            const transformed = this.config.errorMonitoring.customErrorTransformer(error, request, response);
            if (transformed) {
                Object.assign(errorModel, transformed);
            }
        }
        this.updateErrorHistory(errorModel);
        if (((_a = this.config.aiSummarization) === null || _a === void 0 ? void 0 : _a.enabled) && this.openAiService) {
            try {
                const aiSummary = await this.openAiService.analyzeError(errorModel, this.errorHistory);
                errorModel.aiSummary = aiSummary;
            }
            catch (aiError) {
                console.error("Failed to generate AI summary:", aiError);
            }
        }
        await this.sendNotifications(errorModel);
    }
    async sendNotifications(errorModel) {
        var _a, _b, _c, _d;
        const promises = [];
        if (((_a = this.config.notifications.slack) === null || _a === void 0 ? void 0 : _a.enabled) && this.slackService) {
            promises.push(this.slackService.sendAlert(errorModel));
        }
        if (((_b = this.config.notifications.email) === null || _b === void 0 ? void 0 : _b.enabled) && this.emailService) {
            promises.push(this.emailService.sendAlert(errorModel));
        }
        if (((_c = this.config.notifications.twilio) === null || _c === void 0 ? void 0 : _c.enabled) && this.twilioService) {
            if (this.config.notifications.twilio.sms) {
                promises.push(this.twilioService.sendSmsAlert(errorModel));
            }
            if (this.config.notifications.twilio.whatsapp) {
                promises.push(this.twilioService.sendWhatsAppAlert(errorModel));
            }
        }
        if (((_d = this.config.notifications.webhook) === null || _d === void 0 ? void 0 : _d.enabled) && this.webhookService) {
            promises.push(this.webhookService.sendAlert(errorModel));
        }
        if (promises.length > 0) {
            try {
                await Promise.all(promises);
            }
            catch (error) {
                console.error("Failed to send notifications:", error);
            }
        }
    }
    updateErrorHistory(errorModel) {
        var _a;
        this.errorHistory.push(errorModel);
        const maxHistory = ((_a = this.config.aiSummarization) === null || _a === void 0 ? void 0 : _a.maxHistoryLength) || 5;
        if (this.errorHistory.length > maxHistory) {
            this.errorHistory = this.errorHistory.slice(-maxHistory);
        }
    }
};
exports.ApiMonitorService = ApiMonitorService;
exports.ApiMonitorService = ApiMonitorService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(injection_tokens_1.API_MONITOR_CONFIG)),
    __param(1, (0, common_1.Optional)()),
    __param(2, (0, common_1.Optional)()),
    __param(3, (0, common_1.Optional)()),
    __param(4, (0, common_1.Optional)()),
    __param(5, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [Object, slack_service_1.SlackService,
        email_service_1.EmailService,
        twilio_service_1.TwilioService,
        webhook_service_1.WebhookService,
        openai_service_1.OpenAiService])
], ApiMonitorService);
//# sourceMappingURL=api-monitor.service.js.map