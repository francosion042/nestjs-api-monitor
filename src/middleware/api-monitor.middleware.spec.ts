import { Test, TestingModule } from '@nestjs/testing';
import { ApiMonitorMiddleware } from './api-monitor.middleware';
import { ApiMonitorService } from '../services/api-monitor.service';
import { API_MONITOR_CONFIG } from '../constants/injection-tokens';

describe('ApiMonitorMiddleware', () => {
  let middleware: ApiMonitorMiddleware;
  let apiMonitorService: ApiMonitorService;
  let processErrorMock: jest.Mock;

  const mockConfig = {
    errorMonitoring: {
      statusCodes: [400, 404, 500],
      includeStackTrace: true,
      includeRequestBody: true,
      includeResponseBody: true,
      includeHeaders: false,
      excludePaths: ['/health'],
    },
    notifications: {
      slack: { enabled: false },
    },
  };

  beforeEach(async () => {
    processErrorMock = jest.fn().mockImplementation((error, request, response) => {
      // Mock implementation that properly passes the response body through
      if (response && mockConfig.errorMonitoring.includeResponseBody) {
        response.body = { error: 'Test error' };
      }
      return Promise.resolve();
    });
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiMonitorMiddleware,
        {
          provide: ApiMonitorService,
          useValue: {
            processError: processErrorMock,
          },
        },
        {
          provide: API_MONITOR_CONFIG,
          useValue: mockConfig,
        },
      ],
    }).compile();

    middleware = module.get<ApiMonitorMiddleware>(ApiMonitorMiddleware);
    apiMonitorService = module.get<ApiMonitorService>(ApiMonitorService);
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should skip monitoring for excluded paths', () => {
    const req = { url: '/health/status' } as any;
    const res = {} as any;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(processErrorMock).not.toHaveBeenCalled();
  });

  it('should override response methods and monitor errors', () => {
    // Mock the date for predictable timestamps in tests
    const mockDate = new Date('2023-01-01T00:00:00Z');
    const spy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

    const req = {
      method: 'GET',
      url: '/api/users',
      params: {},
      query: {},
      body: { test: true },
      headers: { 'content-type': 'application/json' },
      ip: '127.0.0.1',
    } as any;

    const res = {
      send: jest.fn().mockImplementation(function(body) { 
        this.sentBody = body; // Store the sent body for later inspection
        return this; 
      }),
      json: jest.fn().mockImplementation(function() { return this; }),
      end: jest.fn().mockImplementation(function() { return this; }),
      on: jest.fn().mockImplementation(function(event, callback) {
        if (event === 'finish') {
          this.statusCode = 500;
          callback();
        }
        return this;
      }),
      statusCode: 200,
      sentBody: null, // This will store what was sent
    } as any;

    const next = jest.fn();

    middleware.use(req, res, next);
    
    // Simulate sending a response
    res.send({ error: 'Test error' });

    // Verify expectations
    expect(next).toHaveBeenCalled();
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    expect(processErrorMock).toHaveBeenCalled();
    
    // Check that the error object was properly created
    expect(processErrorMock.mock.calls[0][0]).toMatchObject({
      name: 'ApiError',
      message: expect.stringContaining('HTTP 500'),
      statusCode: 500,
    });
    
    // Check that the request data was passed
    expect(processErrorMock.mock.calls[0][1]).toMatchObject({
      method: 'GET',
      url: '/api/users',
    });
    
    // Check that the response data was passed
    expect(processErrorMock.mock.calls[0][2]).toMatchObject({
      statusCode: 500,
    });

    // Verify the sent body was captured
    expect(res.sentBody).toEqual({ error: 'Test error' });

    // Clean up
    spy.mockRestore();
  });

  it('should not monitor if status code is not in the list', () => {
    const req = {
      method: 'GET',
      url: '/api/users',
      params: {},
      query: {},
      body: {},
      headers: {},
      ip: '127.0.0.1',
    } as any;

    const res = {
      send: jest.fn().mockImplementation(function() { return this; }),
      json: jest.fn().mockImplementation(function() { return this; }),
      end: jest.fn().mockImplementation(function() { return this; }),
      on: jest.fn().mockImplementation(function(event, callback) {
        if (event === 'finish') {
          this.statusCode = 200;
          callback();
        }
        return this;
      }),
      statusCode: 200,
    } as any;

    const next = jest.fn();

    middleware.use(req, res, next);
    res.send({ data: 'Success' });

    expect(next).toHaveBeenCalled();
    expect(processErrorMock).not.toHaveBeenCalled();
  });
}); 