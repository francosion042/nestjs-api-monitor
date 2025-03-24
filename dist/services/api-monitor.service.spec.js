"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const api_monitor_service_1 = require("./api-monitor.service");
const slack_service_1 = require("./slack.service");
const email_service_1 = require("./email.service");
const twilio_service_1 = require("./twilio.service");
const openai_service_1 = require("./openai.service");
const injection_tokens_1 = require("../constants/injection-tokens");
describe('ApiMonitorService', () => {
    let service;
    let slackService;
    let emailService;
    let twilioService;
    let openAiService;
    const mockConfig = {
        errorMonitoring: {
            statusCodes: [400, 404, 500],
            includeStackTrace: true,
            includeRequestBody: true,
            includeResponseBody: true,
            includeHeaders: false,
        },
        notifications: {
            slack: { enabled: true },
            email: { enabled: true },
            twilio: {
                enabled: true,
                sms: { from: 'test', to: ['test'] },
                whatsapp: { from: 'whatsapp:test', to: ['whatsapp:test'] },
            },
        },
        aiSummarization: {
            enabled: true,
            maxHistoryLength: 2,
        },
    };
    const mockError = {
        name: 'TestError',
        message: 'Test error message',
        statusCode: 500,
        timestamp: new Date().toISOString(),
    };
    const mockRequest = {
        method: 'GET',
        url: '/api/test',
        timestamp: new Date().toISOString(),
    };
    const mockResponse = {
        statusCode: 500,
        body: { error: 'Test error' },
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                api_monitor_service_1.ApiMonitorService,
                {
                    provide: slack_service_1.SlackService,
                    useValue: {
                        sendAlert: jest.fn().mockResolvedValue(undefined),
                    },
                },
                {
                    provide: email_service_1.EmailService,
                    useValue: {
                        sendAlert: jest.fn().mockResolvedValue(undefined),
                    },
                },
                {
                    provide: twilio_service_1.TwilioService,
                    useValue: {
                        sendSmsAlert: jest.fn().mockResolvedValue(undefined),
                        sendWhatsAppAlert: jest.fn().mockResolvedValue(undefined),
                    },
                },
                {
                    provide: openai_service_1.OpenAiService,
                    useValue: {
                        analyzeError: jest.fn().mockResolvedValue({
                            summary: 'AI summary',
                            possibleSolutions: ['Solution 1'],
                            confidence: 'high',
                        }),
                    },
                },
                {
                    provide: injection_tokens_1.API_MONITOR_CONFIG,
                    useValue: mockConfig,
                },
            ],
        }).compile();
        service = module.get(api_monitor_service_1.ApiMonitorService);
        slackService = module.get(slack_service_1.SlackService);
        emailService = module.get(email_service_1.EmailService);
        twilioService = module.get(twilio_service_1.TwilioService);
        openAiService = module.get(openai_service_1.OpenAiService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    it('should process error and send notifications', async () => {
        await service.processError(mockError, mockRequest, mockResponse);
        expect(openAiService.analyzeError).toHaveBeenCalled();
        expect(slackService.sendAlert).toHaveBeenCalled();
        expect(emailService.sendAlert).toHaveBeenCalled();
        expect(twilioService.sendSmsAlert).toHaveBeenCalled();
        expect(twilioService.sendWhatsAppAlert).toHaveBeenCalled();
        expect(slackService.sendAlert).toHaveBeenCalledWith(expect.objectContaining({
            aiSummary: {
                summary: 'AI summary',
                possibleSolutions: ['Solution 1'],
                confidence: 'high',
            },
        }));
    });
    it('should handle custom error transformers', async () => {
        const configWithTransformer = Object.assign(Object.assign({}, mockConfig), { errorMonitoring: Object.assign(Object.assign({}, mockConfig.errorMonitoring), { customErrorTransformer: jest.fn().mockReturnValue({
                    metadata: {
                        customField: 'custom value',
                    },
                }) }) });
        const module = await testing_1.Test.createTestingModule({
            providers: [
                api_monitor_service_1.ApiMonitorService,
                {
                    provide: slack_service_1.SlackService,
                    useValue: {
                        sendAlert: jest.fn().mockResolvedValue(undefined),
                    },
                },
                {
                    provide: email_service_1.EmailService,
                    useValue: {
                        sendAlert: jest.fn().mockResolvedValue(undefined),
                    },
                },
                {
                    provide: twilio_service_1.TwilioService,
                    useValue: {
                        sendSmsAlert: jest.fn().mockResolvedValue(undefined),
                        sendWhatsAppAlert: jest.fn().mockResolvedValue(undefined),
                    },
                },
                {
                    provide: openai_service_1.OpenAiService,
                    useValue: {
                        analyzeError: jest.fn().mockResolvedValue({
                            summary: 'AI summary',
                        }),
                    },
                },
                {
                    provide: injection_tokens_1.API_MONITOR_CONFIG,
                    useValue: configWithTransformer,
                },
            ],
        }).compile();
        const serviceWithTransformer = module.get(api_monitor_service_1.ApiMonitorService);
        const slackServiceWithTransformer = module.get(slack_service_1.SlackService);
        await serviceWithTransformer.processError(mockError, mockRequest, mockResponse);
        expect(configWithTransformer.errorMonitoring.customErrorTransformer).toHaveBeenCalledWith(mockError, mockRequest, mockResponse);
        expect(slackServiceWithTransformer.sendAlert).toHaveBeenCalledWith(expect.objectContaining({
            metadata: expect.objectContaining({
                customField: 'custom value',
            }),
        }));
    });
    it('should limit error history based on config', async () => {
        await service.processError(Object.assign(Object.assign({}, mockError), { message: 'Error 1' }), mockRequest, mockResponse);
        await service.processError(Object.assign(Object.assign({}, mockError), { message: 'Error 2' }), mockRequest, mockResponse);
        await service.processError(Object.assign(Object.assign({}, mockError), { message: 'Error 3' }), mockRequest, mockResponse);
        expect(openAiService.analyzeError).toHaveBeenCalledTimes(3);
        const lastCall = openAiService.analyzeError.mock.calls[2];
        const errorHistory = lastCall[1];
        expect(errorHistory.length).toBe(2);
        expect(errorHistory[0].error.message).toBe('Error 2');
        expect(errorHistory[1].error.message).toBe('Error 3');
    });
});
//# sourceMappingURL=api-monitor.service.spec.js.map