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
exports.ApiMonitorMiddleware = void 0;
const common_1 = require("@nestjs/common");
const injection_tokens_1 = require("../constants/injection-tokens");
const api_monitor_service_1 = require("../services/api-monitor.service");
let ApiMonitorMiddleware = class ApiMonitorMiddleware {
    constructor(config, apiMonitorService) {
        this.config = config;
        this.apiMonitorService = apiMonitorService;
    }
    use(req, res, next) {
        var _a;
        if ((_a = this.config.errorMonitoring.excludePaths) === null || _a === void 0 ? void 0 : _a.some((path) => req.url.includes(path))) {
            return next();
        }
        const requestData = {
            method: req.method,
            url: req.url,
            params: req.params,
            query: req.query,
            body: this.config.errorMonitoring.includeRequestBody
                ? req.body
                : undefined,
            headers: this.config.errorMonitoring.includeHeaders
                ? this.sanitizeHeaders(req.headers)
                : undefined,
            ip: req.ip,
            timestamp: new Date().toISOString(),
        };
        const originalSend = res.send;
        const originalJson = res.json;
        const originalEnd = res.end;
        let responseBody;
        res.send = function (body) {
            responseBody = body;
            return originalSend.call(this, body);
        };
        res.json = function (body) {
            responseBody = body;
            return originalJson.call(this, body);
        };
        res.on("finish", () => {
            const statusCode = res.statusCode;
            if (this.config.errorMonitoring.statusCodes.includes(statusCode)) {
                let parsedResponseBody;
                if (typeof responseBody === "string") {
                    try {
                        parsedResponseBody = JSON.parse(responseBody);
                    }
                    catch (e) {
                        parsedResponseBody = responseBody;
                    }
                }
                else {
                    parsedResponseBody = responseBody;
                }
                const error = {
                    name: "ApiError",
                    message: `HTTP ${statusCode} - ${req.method} ${req.url}`,
                    statusCode,
                    path: req.url,
                    timestamp: new Date().toISOString(),
                };
                this.apiMonitorService.processError(error, requestData, {
                    body: this.config.errorMonitoring.includeResponseBody
                        ? parsedResponseBody
                        : undefined,
                    statusCode,
                });
            }
        });
        next();
    }
    sanitizeHeaders(headers) {
        const sanitizedHeaders = Object.assign({}, headers);
        const sensitiveHeaders = [
            "authorization",
            "cookie",
            "set-cookie",
            "x-api-key",
            "api-key",
        ];
        sensitiveHeaders.forEach((header) => {
            if (sanitizedHeaders[header]) {
                sanitizedHeaders[header] = "[REDACTED]";
            }
        });
        return sanitizedHeaders;
    }
};
exports.ApiMonitorMiddleware = ApiMonitorMiddleware;
exports.ApiMonitorMiddleware = ApiMonitorMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(injection_tokens_1.API_MONITOR_CONFIG)),
    __metadata("design:paramtypes", [Object, api_monitor_service_1.ApiMonitorService])
], ApiMonitorMiddleware);
//# sourceMappingURL=api-monitor.middleware.js.map