import { Test, TestingModule } from '@nestjs/testing';
import { OpenAiService } from './openai.service';
import { API_MONITOR_CONFIG } from '../constants/injection-tokens';
import { ApiErrorModel } from '../interfaces/error-model.interface';

// Mock the OpenAI client
jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content:
                    '{"summary":"This is an AI summary","possibleSolutions":["Fix 1","Fix 2"],"confidence":"high"}',
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
  let service: OpenAiService;
  let mockOpenAI: any;

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

  const mockErrorModel: ApiErrorModel = {
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAiService,
        {
          provide: API_MONITOR_CONFIG,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<OpenAiService>(OpenAiService);
    // Get the mocked OpenAI client from the constructor
    mockOpenAI = (service as any).openai;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize OpenAI client with API key', () => {
    expect(mockOpenAI).toBeDefined();
  });

  it('should analyze errors using the OpenAI API', async () => {
    const result = await service.analyzeError(mockErrorModel, [mockErrorModel]);

    // Check that OpenAI API was called with correct parameters
    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
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
      }),
    );

    // Check the returned analysis
    expect(result).toEqual({
      summary: 'This is an AI summary',
      possibleSolutions: ['Fix 1', 'Fix 2'],
      confidence: 'high',
    });
  });

  it('should return a default response if AI is not enabled', async () => {
    const disabledConfig = {
      ...mockConfig,
      aiSummarization: {
        ...mockConfig.aiSummarization,
        enabled: false,
      },
    };

    const moduleWithAiDisabled: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAiService,
        {
          provide: API_MONITOR_CONFIG,
          useValue: disabledConfig,
        },
      ],
    }).compile();

    const serviceWithAiDisabled = moduleWithAiDisabled.get<OpenAiService>(OpenAiService);

    const result = await serviceWithAiDisabled.analyzeError(mockErrorModel, [mockErrorModel]);

    // Should return a default message without calling OpenAI
    expect(result).toEqual({
      summary: 'AI analysis not available',
    });
  });

  it('should handle OpenAI API errors gracefully', async () => {
    // Mock the OpenAI client to throw an error
    mockOpenAI.chat.completions.create.mockRejectedValueOnce(new Error('API Error'));

    const result = await service.analyzeError(mockErrorModel, [mockErrorModel]);

    // Should return an error message
    expect(result).toEqual({
      summary: 'Failed to perform AI analysis due to API error',
    });
  });

  it('should include error history in the prompt', async () => {
    const errorHistory: ApiErrorModel[] = [
      {
        ...mockErrorModel,
        error: {
          ...mockErrorModel.error,
          message: 'Previous error 1',
        },
      },
      {
        ...mockErrorModel,
        error: {
          ...mockErrorModel.error,
          message: 'Previous error 2',
        },
      },
      mockErrorModel, // Current error
    ];

    await service.analyzeError(mockErrorModel, errorHistory);

    // Check that the prompt includes previous errors
    const callArguments = mockOpenAI.chat.completions.create.mock.calls[0][0];
    const userPrompt = callArguments.messages[1].content;

    expect(userPrompt).toContain('Recent Error History');
    expect(userPrompt).toContain('Previous Error 1');
    expect(userPrompt).toContain('Previous Error 2');
  });
}); 