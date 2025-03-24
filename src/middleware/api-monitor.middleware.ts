import { Inject, Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { ApiMonitorConfig } from "../interfaces/api-monitor-config.interface";
import { API_MONITOR_CONFIG } from "../constants/injection-tokens";
import { ApiMonitorService } from "../services/api-monitor.service";

@Injectable()
export class ApiMonitorMiddleware implements NestMiddleware {
  constructor(
    @Inject(API_MONITOR_CONFIG) private readonly config: ApiMonitorConfig,
    private readonly apiMonitorService: ApiMonitorService
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Skip monitoring for excluded paths
    if (
      this.config.errorMonitoring.excludePaths?.some((path) =>
        req.url.includes(path)
      )
    ) {
      return next();
    }

    // Store original request data before it might be modified
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

    // Store the original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;
    let responseBody: any;

    // Override response.send
    res.send = function (body: any): Response {
      responseBody = body;
      return originalSend.call(this, body);
    };

    // Override response.json
    res.json = function (body: any): Response {
      responseBody = body;
      return originalJson.call(this, body);
    };

    // Monitor response on completion
    res.on("finish", () => {
      const statusCode = res.statusCode;

      // Check if the status code should be monitored
      if (this.config.errorMonitoring.statusCodes.includes(statusCode)) {
        let parsedResponseBody;

        // Try to parse the response body if it's a string
        if (typeof responseBody === "string") {
          try {
            parsedResponseBody = JSON.parse(responseBody);
          } catch (e) {
            parsedResponseBody = responseBody;
          }
        } else {
          parsedResponseBody = responseBody;
        }

        // Create error object
        const error = {
          name: "ApiError",
          message: `HTTP ${statusCode} - ${req.method} ${req.url}`,
          statusCode,
          path: req.url,
          timestamp: new Date().toISOString(),
        };

        // Process the error through the monitor service
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

  private sanitizeHeaders(
    headers: Record<string, string | string[] | undefined>
  ): Record<string, string | string[] | undefined> {
    // Copy headers to avoid modifying the original
    const sanitizedHeaders = { ...headers };

    // Remove sensitive headers
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
}
