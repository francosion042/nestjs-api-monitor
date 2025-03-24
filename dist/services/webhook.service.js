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
exports.WebhookService = void 0;
const common_1 = require("@nestjs/common");
const injection_tokens_1 = require("../constants/injection-tokens");
const axios_1 = require("axios");
let WebhookService = class WebhookService {
    constructor(config) {
        this.config = config;
    }
    async sendAlert(errorModel) {
        var _a, _b;
        if (!((_a = this.config.notifications.webhook) === null || _a === void 0 ? void 0 : _a.enabled)) {
            return;
        }
        try {
            const webhookConfig = this.config.notifications.webhook;
            const method = ((_b = webhookConfig.method) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || 'post';
            const url = webhookConfig.url;
            const headers = webhookConfig.headers || {};
            const payload = this.formatWebhookPayload(errorModel);
            switch (method) {
                case 'get':
                    await axios_1.default.get(url, { headers, params: payload });
                    break;
                case 'post':
                    await axios_1.default.post(url, payload, { headers });
                    break;
                case 'put':
                    await axios_1.default.put(url, payload, { headers });
                    break;
                case 'patch':
                    await axios_1.default.patch(url, payload, { headers });
                    break;
                case 'delete':
                    await axios_1.default.delete(url, { headers, data: payload });
                    break;
                default:
                    await axios_1.default.post(url, payload, { headers });
            }
        }
        catch (error) {
            console.error('Failed to send webhook notification:', error);
        }
    }
    formatWebhookPayload(errorModel) {
        const { error, request, response, metadata, aiSummary } = errorModel;
        const payload = {
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
        if (request.ip) {
            payload.request.ip = request.ip;
        }
        if (error.stack && this.config.errorMonitoring.includeStackTrace) {
            payload.error.stack = error.stack;
        }
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
        if (response) {
            payload.response = {
                statusCode: response.statusCode,
            };
            if (this.config.errorMonitoring.includeResponseBody && response.body) {
                payload.response.body = response.body;
            }
        }
        if (aiSummary) {
            payload.aiSummary = aiSummary;
        }
        return payload;
    }
};
exports.WebhookService = WebhookService;
exports.WebhookService = WebhookService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(injection_tokens_1.API_MONITOR_CONFIG)),
    __metadata("design:paramtypes", [Object])
], WebhookService);
//# sourceMappingURL=webhook.service.js.map