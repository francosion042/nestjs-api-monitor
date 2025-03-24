"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const api_monitor_middleware_1 = require("./api-monitor.middleware");
const api_monitor_service_1 = require("../services/api-monitor.service");
const injection_tokens_1 = require("../constants/injection-tokens");
describe('ApiMonitorMiddleware', () => {
    let middleware;
    let apiMonitorService;
    let processErrorMock;
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
            if (response && mockConfig.errorMonitoring.includeResponseBody) {
                response.body = { error: 'Test error' };
            }
            return Promise.resolve();
        });
        const module = await testing_1.Test.createTestingModule({
            providers: [
                api_monitor_middleware_1.ApiMonitorMiddleware,
                {
                    provide: api_monitor_service_1.ApiMonitorService,
                    useValue: {
                        processError: processErrorMock,
                    },
                },
                {
                    provide: injection_tokens_1.API_MONITOR_CONFIG,
                    useValue: mockConfig,
                },
            ],
        }).compile();
        middleware = module.get(api_monitor_middleware_1.ApiMonitorMiddleware);
        apiMonitorService = module.get(api_monitor_service_1.ApiMonitorService);
    });
    it('should be defined', () => {
        expect(middleware).toBeDefined();
    });
    it('should skip monitoring for excluded paths', () => {
        const req = { url: '/health/status' };
        const res = {};
        const next = jest.fn();
        middleware.use(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(processErrorMock).not.toHaveBeenCalled();
    });
    it('should override response methods and monitor errors', () => {
        const mockDate = new Date('2023-01-01T00:00:00Z');
        const spy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
        const req = {
            method: 'GET',
            url: '/api/users',
            params: {},
            query: {},
            body: { test: true },
            headers: { 'content-type': 'application/json' },
            ip: '127.0.0.1',
        };
        const res = {
            send: jest.fn().mockImplementation(function (body) {
                this.sentBody = body;
                return this;
            }),
            json: jest.fn().mockImplementation(function () { return this; }),
            end: jest.fn().mockImplementation(function () { return this; }),
            on: jest.fn().mockImplementation(function (event, callback) {
                if (event === 'finish') {
                    this.statusCode = 500;
                    callback();
                }
                return this;
            }),
            statusCode: 200,
            sentBody: null,
        };
        const next = jest.fn();
        middleware.use(req, res, next);
        res.send({ error: 'Test error' });
        expect(next).toHaveBeenCalled();
        expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
        expect(processErrorMock).toHaveBeenCalled();
        expect(processErrorMock.mock.calls[0][0]).toMatchObject({
            name: 'ApiError',
            message: expect.stringContaining('HTTP 500'),
            statusCode: 500,
        });
        expect(processErrorMock.mock.calls[0][1]).toMatchObject({
            method: 'GET',
            url: '/api/users',
        });
        expect(processErrorMock.mock.calls[0][2]).toMatchObject({
            statusCode: 500,
        });
        expect(res.sentBody).toEqual({ error: 'Test error' });
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
        };
        const res = {
            send: jest.fn().mockImplementation(function () { return this; }),
            json: jest.fn().mockImplementation(function () { return this; }),
            end: jest.fn().mockImplementation(function () { return this; }),
            on: jest.fn().mockImplementation(function (event, callback) {
                if (event === 'finish') {
                    this.statusCode = 200;
                    callback();
                }
                return this;
            }),
            statusCode: 200,
        };
        const next = jest.fn();
        middleware.use(req, res, next);
        res.send({ data: 'Success' });
        expect(next).toHaveBeenCalled();
        expect(processErrorMock).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=api-monitor.middleware.spec.js.map