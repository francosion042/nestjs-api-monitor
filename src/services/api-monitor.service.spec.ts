import { Test, TestingModule } from '@nestjs/testing';
import { ApiMonitorService } from './api-monitor.service';
import { SlackService } from './slack.service';
import { EmailService } from './email.service';
import { TwilioService } from './twilio.service';
import { OpenAiService } from './openai.service';
import { API_MONITOR_CONFIG } from '../constants/injection-tokens';
import { ApiErrorModel, ErrorDetails, RequestDetails } from '../interfaces/error-model.interface';

describe('ApiMonitorService', () => {
  let service: ApiMonitorService;
  let slackService: SlackService;
  let emailService: EmailService;
  let twilioService: TwilioService;
  let openAiService: OpenAiService;

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

  const mockError: ErrorDetails = {
    name: 'TestError',
    message: 'Test error message',
    statusCode: 500,
    timestamp: new Date().toISOString(),
  };

  const mockRequest: RequestDetails = {
    method: 'GET',
    url: '/api/test',
    timestamp: new Date().toISOString(),
  };

  const mockResponse = {
    statusCode: 500,
    body: { error: 'Test error' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiMonitorService,
        {
          provide: SlackService,
          useValue: {
            sendAlert: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendAlert: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: TwilioService,
          useValue: {
            sendSmsAlert: jest.fn().mockResolvedValue(undefined),
            sendWhatsAppAlert: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: OpenAiService,
          useValue: {
            analyzeError: jest.fn().mockResolvedValue({
              summary: 'AI summary',
              possibleSolutions: ['Solution 1'],
              confidence: 'high',
            }),
          },
        },
        {
          provide: API_MONITOR_CONFIG,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<ApiMonitorService>(ApiMonitorService);
    slackService = module.get<SlackService>(SlackService);
    emailService = module.get<EmailService>(EmailService);
    twilioService = module.get<TwilioService>(TwilioService);
    openAiService = module.get<OpenAiService>(OpenAiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process error and send notifications', async () => {
    await service.processError(mockError, mockRequest, mockResponse);

    // Should call AI analysis
    expect(openAiService.analyzeError).toHaveBeenCalled();

    // Should send notifications
    expect(slackService.sendAlert).toHaveBeenCalled();
    expect(emailService.sendAlert).toHaveBeenCalled();
    expect(twilioService.sendSmsAlert).toHaveBeenCalled();
    expect(twilioService.sendWhatsAppAlert).toHaveBeenCalled();

    // Check AI summary was added to the error model
    expect(slackService.sendAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        aiSummary: {
          summary: 'AI summary',
          possibleSolutions: ['Solution 1'],
          confidence: 'high',
        },
      }),
    );
  });

  it('should handle custom error transformers', async () => {
    const configWithTransformer = {
      ...mockConfig,
      errorMonitoring: {
        ...mockConfig.errorMonitoring,
        customErrorTransformer: jest.fn().mockReturnValue({
          metadata: {
            customField: 'custom value',
          },
        }),
      },
    };

    // Replace the config
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiMonitorService,
        {
          provide: SlackService,
          useValue: {
            sendAlert: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendAlert: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: TwilioService,
          useValue: {
            sendSmsAlert: jest.fn().mockResolvedValue(undefined),
            sendWhatsAppAlert: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: OpenAiService,
          useValue: {
            analyzeError: jest.fn().mockResolvedValue({
              summary: 'AI summary',
            }),
          },
        },
        {
          provide: API_MONITOR_CONFIG,
          useValue: configWithTransformer,
        },
      ],
    }).compile();

    const serviceWithTransformer = module.get<ApiMonitorService>(ApiMonitorService);
    const slackServiceWithTransformer = module.get<SlackService>(SlackService);

    await serviceWithTransformer.processError(mockError, mockRequest, mockResponse);

    // Check transformer was called
    expect(configWithTransformer.errorMonitoring.customErrorTransformer).toHaveBeenCalledWith(
      mockError,
      mockRequest,
      mockResponse,
    );

    // Check custom field was added
    expect(slackServiceWithTransformer.sendAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          customField: 'custom value',
        }),
      }),
    );
  });

  it('should limit error history based on config', async () => {
    // Process 3 errors, but config maxHistoryLength is 2
    await service.processError(
      { ...mockError, message: 'Error 1' },
      mockRequest,
      mockResponse,
    );
    await service.processError(
      { ...mockError, message: 'Error 2' },
      mockRequest,
      mockResponse,
    );
    await service.processError(
      { ...mockError, message: 'Error 3' },
      mockRequest,
      mockResponse,
    );

    // On the third call, the first error should be removed from history
    // We indirectly test this by checking the calls to analyzeError
    expect(openAiService.analyzeError).toHaveBeenCalledTimes(3);
    
    const lastCall = (openAiService.analyzeError as jest.Mock).mock.calls[2];
    const errorHistory = lastCall[1] as ApiErrorModel[];
    
    expect(errorHistory.length).toBe(2);
    expect(errorHistory[0].error.message).toBe('Error 2');
    expect(errorHistory[1].error.message).toBe('Error 3');
  });
}); 