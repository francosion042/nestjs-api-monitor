"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ApiMonitorModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiMonitorModule = void 0;
const common_1 = require("@nestjs/common");
const api_monitor_middleware_1 = require("./middleware/api-monitor.middleware");
const slack_service_1 = require("./services/slack.service");
const email_service_1 = require("./services/email.service");
const twilio_service_1 = require("./services/twilio.service");
const openai_service_1 = require("./services/openai.service");
const webhook_service_1 = require("./services/webhook.service");
const injection_tokens_1 = require("./constants/injection-tokens");
const api_monitor_service_1 = require("./services/api-monitor.service");
let ApiMonitorModule = ApiMonitorModule_1 = class ApiMonitorModule {
    static forRoot(config) {
        var _a, _b, _c, _d, _e;
        const providers = [
            {
                provide: injection_tokens_1.API_MONITOR_CONFIG,
                useValue: config,
            },
            api_monitor_service_1.ApiMonitorService,
            api_monitor_middleware_1.ApiMonitorMiddleware,
        ];
        if ((_a = config.notifications.slack) === null || _a === void 0 ? void 0 : _a.enabled) {
            providers.push(slack_service_1.SlackService);
        }
        if ((_b = config.notifications.email) === null || _b === void 0 ? void 0 : _b.enabled) {
            providers.push(email_service_1.EmailService);
        }
        if ((_c = config.notifications.twilio) === null || _c === void 0 ? void 0 : _c.enabled) {
            providers.push(twilio_service_1.TwilioService);
        }
        if ((_d = config.notifications.webhook) === null || _d === void 0 ? void 0 : _d.enabled) {
            providers.push(webhook_service_1.WebhookService);
        }
        if ((_e = config.aiSummarization) === null || _e === void 0 ? void 0 : _e.enabled) {
            providers.push(openai_service_1.OpenAiService);
        }
        return {
            module: ApiMonitorModule_1,
            providers,
            exports: [api_monitor_middleware_1.ApiMonitorMiddleware, api_monitor_service_1.ApiMonitorService],
            global: config.global || false,
        };
    }
    static forRootAsync(options) {
        const asyncProviders = this.createAsyncProviders(options);
        return {
            module: ApiMonitorModule_1,
            imports: options.imports || [],
            providers: [
                ...asyncProviders,
                api_monitor_service_1.ApiMonitorService,
                api_monitor_middleware_1.ApiMonitorMiddleware,
                {
                    provide: slack_service_1.SlackService,
                    useFactory: (config) => {
                        var _a;
                        return ((_a = config.notifications.slack) === null || _a === void 0 ? void 0 : _a.enabled) ? new slack_service_1.SlackService(config) : null;
                    },
                    inject: [injection_tokens_1.API_MONITOR_CONFIG],
                },
                {
                    provide: email_service_1.EmailService,
                    useFactory: (config) => {
                        var _a;
                        return ((_a = config.notifications.email) === null || _a === void 0 ? void 0 : _a.enabled) ? new email_service_1.EmailService(config) : null;
                    },
                    inject: [injection_tokens_1.API_MONITOR_CONFIG],
                },
                {
                    provide: twilio_service_1.TwilioService,
                    useFactory: (config) => {
                        var _a;
                        return ((_a = config.notifications.twilio) === null || _a === void 0 ? void 0 : _a.enabled) ? new twilio_service_1.TwilioService(config) : null;
                    },
                    inject: [injection_tokens_1.API_MONITOR_CONFIG],
                },
                {
                    provide: webhook_service_1.WebhookService,
                    useFactory: (config) => {
                        var _a;
                        return ((_a = config.notifications.webhook) === null || _a === void 0 ? void 0 : _a.enabled) ? new webhook_service_1.WebhookService(config) : null;
                    },
                    inject: [injection_tokens_1.API_MONITOR_CONFIG],
                },
                {
                    provide: openai_service_1.OpenAiService,
                    useFactory: (config) => {
                        var _a;
                        return ((_a = config.aiSummarization) === null || _a === void 0 ? void 0 : _a.enabled) ? new openai_service_1.OpenAiService(config) : null;
                    },
                    inject: [injection_tokens_1.API_MONITOR_CONFIG],
                },
            ],
            exports: [api_monitor_middleware_1.ApiMonitorMiddleware, api_monitor_service_1.ApiMonitorService],
            global: true,
        };
    }
    static createAsyncProviders(options) {
        return [
            {
                provide: injection_tokens_1.API_MONITOR_CONFIG,
                useFactory: async (...args) => {
                    const config = await options.useFactory(...args);
                    return config;
                },
                inject: options.inject || [],
            },
        ];
    }
};
exports.ApiMonitorModule = ApiMonitorModule;
exports.ApiMonitorModule = ApiMonitorModule = ApiMonitorModule_1 = __decorate([
    (0, common_1.Module)({})
], ApiMonitorModule);
//# sourceMappingURL=api-monitor.module.js.map