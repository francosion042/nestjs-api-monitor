"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const openai_service_1 = require("./openai.service");
const injection_tokens_1 = require("../constants/injection-tokens");
jest.mock('openai', () => {
    return {
        default: jest.fn().mockImplementation(() => ({
            chat: {
                completions: {
                    create: jest.fn().mockResolvedValue({
                        choices: [
                            {
                                message: {
                                    content: '{"summary":"This is an AI summary","possibleSolutions":["Fix 1","Fix 2"],"confidence":"high"}',
                                },
                            },
                        ],
                    }),
                },
            },
        })),
    };
});
describe('OpenAiService', () => {
    let service;
    let mockOpenAI;
    const mockConfig = {
        errorMonitoring: {
            includeStackTrace: true,
            includeRequestBody: true,
            includeResponseBody: true,
        },
        aiSummarization: {
            enabled: true,
            apiKey: 'test-api-key',
            model: 'gpt-4-turbo',
            maxTokens: 350,
            temperature: 0.3,
        },
    };
    const mockErrorModel = {
        error: {
            name: 'TestError',
            message: 'Test error message',
            statusCode: 500,
            timestamp: new Date().toISOString(),
            stack: 'Error: Test error message\n    at Test.function (/app/test.js:10:10)',
        },
        request: {
            method: 'GET',
            url: '/api/test',
            timestamp: new Date().toISOString(),
            body: { test: true },
        },
        response: {
            statusCode: 500,
            body: { error: 'Test error' },
        },
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                openai_service_1.OpenAiService,
                {
                    provide: injection_tokens_1.API_MONITOR_CONFIG,
                    useValue: mockConfig,
                },
            ],
        }).compile();
        service = module.get(openai_service_1.OpenAiService);
        mockOpenAI = service.openai;
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    it('should initialize OpenAI client with API key', () => {
        expect(mockOpenAI).toBeDefined();
    });
    it('should analyze errors using the OpenAI API', async () => {
        const result = await service.analyzeError(mockErrorModel, [mockErrorModel]);
        expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(expect.objectContaining({
            model: 'gpt-4-turbo',
            max_tokens: 350,
            temperature: 0.3,
            messages: expect.arrayContaining([
                expect.objectContaining({
                    role: 'system',
                    content: expect.any(String),
                }),
                expect.objectContaining({
                    role: 'user',
                    content: expect.stringContaining('Test error message'),
                }),
            ]),
        }));
        expect(result).toEqual({
            summary: 'This is an AI summary',
            possibleSolutions: ['Fix 1', 'Fix 2'],
            confidence: 'high',
        });
    });
    it('should return a default response if AI is not enabled', async () => {
        const disabledConfig = Object.assign(Object.assign({}, mockConfig), { aiSummarization: Object.assign(Object.assign({}, mockConfig.aiSummarization), { enabled: false }) });
        const moduleWithAiDisabled = await testing_1.Test.createTestingModule({
            providers: [
                openai_service_1.OpenAiService,
                {
                    provide: injection_tokens_1.API_MONITOR_CONFIG,
                    useValue: disabledConfig,
                },
            ],
        }).compile();
        const serviceWithAiDisabled = moduleWithAiDisabled.get(openai_service_1.OpenAiService);
        const result = await serviceWithAiDisabled.analyzeError(mockErrorModel, [mockErrorModel]);
        expect(result).toEqual({
            summary: 'AI analysis not available',
        });
    });
    it('should handle OpenAI API errors gracefully', async () => {
        mockOpenAI.chat.completions.create.mockRejectedValueOnce(new Error('API Error'));
        const result = await service.analyzeError(mockErrorModel, [mockErrorModel]);
        expect(result).toEqual({
            summary: 'Failed to perform AI analysis due to API error',
        });
    });
    it('should include error history in the prompt', async () => {
        const errorHistory = [
            Object.assign(Object.assign({}, mockErrorModel), { error: Object.assign(Object.assign({}, mockErrorModel.error), { message: 'Previous error 1' }) }),
            Object.assign(Object.assign({}, mockErrorModel), { error: Object.assign(Object.assign({}, mockErrorModel.error), { message: 'Previous error 2' }) }),
            mockErrorModel,
        ];
        await service.analyzeError(mockErrorModel, errorHistory);
        const callArguments = mockOpenAI.chat.completions.create.mock.calls[0][0];
        const userPrompt = callArguments.messages[1].content;
        expect(userPrompt).toContain('Recent Error History');
        expect(userPrompt).toContain('Previous Error 1');
        expect(userPrompt).toContain('Previous Error 2');
    });
});
//# sourceMappingURL=openai.service.spec.js.map