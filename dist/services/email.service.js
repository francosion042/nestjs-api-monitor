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
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const injection_tokens_1 = require("../constants/injection-tokens");
const nodemailer = require("nodemailer");
let EmailService = class EmailService {
    constructor(config) {
        var _a;
        this.config = config;
        if ((_a = this.config.notifications.email) === null || _a === void 0 ? void 0 : _a.enabled) {
            this.transporter = nodemailer.createTransport({
                host: this.config.notifications.email.smtp.host,
                port: this.config.notifications.email.smtp.port,
                secure: this.config.notifications.email.smtp.secure || false,
                auth: {
                    user: this.config.notifications.email.smtp.auth.user,
                    pass: this.config.notifications.email.smtp.auth.pass,
                },
            });
        }
    }
    async sendAlert(errorModel) {
        var _a;
        if (!((_a = this.config.notifications.email) === null || _a === void 0 ? void 0 : _a.enabled) || !this.transporter) {
            return;
        }
        try {
            const { subject, html } = this.formatEmailMessage(errorModel);
            await this.transporter.sendMail({
                from: this.config.notifications.email.from,
                to: this.config.notifications.email.to,
                cc: this.config.notifications.email.cc,
                subject,
                html,
            });
        }
        catch (error) {
            console.error("Failed to send email notification:", error);
        }
    }
    formatEmailMessage(errorModel) {
        var _a, _b;
        const { error, request, response, metadata, aiSummary } = errorModel;
        const subject = ((_a = this.config.notifications.email) === null || _a === void 0 ? void 0 : _a.subject) ||
            `[${(metadata === null || metadata === void 0 ? void 0 : metadata.environment) || "PROD"}] API Error: ${error.statusCode} - ${error.name}`;
        let html = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h1 style="color: #d32f2f; margin-bottom: 20px;">API Error: ${error.statusCode} ${error.name}</h1>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p><strong>Error Message:</strong> ${error.message}</p>
          <p><strong>Time:</strong> ${error.timestamp}</p>
          <p><strong>Endpoint:</strong> ${request.method} ${request.url}</p>
          <p><strong>Status Code:</strong> ${error.statusCode}</p>
        </div>

        <!-- Environment Information -->
        <h2 style="color: #333; margin-top: 30px;">Environment Information</h2>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
    `;
        if (metadata) {
            Object.entries(metadata).forEach(([key, value]) => {
                html += `<p><strong>${key}:</strong> ${value}</p>`;
            });
        }
        html += `</div>`;
        html += `
      <h2 style="color: #333; margin-top: 30px;">Request Details</h2>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <p><strong>Method:</strong> ${request.method}</p>
        <p><strong>URL:</strong> ${request.url}</p>
        <p><strong>Timestamp:</strong> ${request.timestamp}</p>
    `;
        if (request.params && Object.keys(request.params).length > 0) {
            html += `<p><strong>Parameters:</strong> ${JSON.stringify(request.params, null, 2)}</p>`;
        }
        if (request.query && Object.keys(request.query).length > 0) {
            html += `<p><strong>Query:</strong> ${JSON.stringify(request.query, null, 2)}</p>`;
        }
        if (request.body && this.config.errorMonitoring.includeRequestBody) {
            html += `
        <p><strong>Request Body:</strong></p>
        <pre style="background-color: #eee; padding: 10px; border-radius: 5px; overflow-x: auto;">
          ${JSON.stringify(request.body, null, 2)}
        </pre>
      `;
        }
        html += `</div>`;
        if (response) {
            html += `
        <h2 style="color: #333; margin-top: 30px;">Response Details</h2>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p><strong>Status Code:</strong> ${response.statusCode}</p>
      `;
            if (response.body && this.config.errorMonitoring.includeResponseBody) {
                html += `
          <p><strong>Response Body:</strong></p>
          <pre style="background-color: #eee; padding: 10px; border-radius: 5px; overflow-x: auto;">
            ${JSON.stringify(response.body, null, 2)}
          </pre>
        `;
            }
            html += `</div>`;
        }
        if (error.stack && this.config.errorMonitoring.includeStackTrace) {
            html += `
        <h2 style="color: #333; margin-top: 30px;">Stack Trace</h2>
        <pre style="background-color: #eee; padding: 10px; border-radius: 5px; overflow-x: auto; margin-bottom: 20px; white-space: pre-wrap;">
          ${error.stack}
        </pre>
      `;
        }
        if (aiSummary) {
            html += `
        <h2 style="color: #333; margin-top: 30px;">AI Analysis</h2>
        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p>${aiSummary.summary}</p>
      `;
            if ((_b = aiSummary.possibleSolutions) === null || _b === void 0 ? void 0 : _b.length) {
                html += `<h3 style="margin-top: 15px;">Possible Solutions:</h3><ul>`;
                aiSummary.possibleSolutions.forEach((solution) => {
                    html += `<li>${solution}</li>`;
                });
                html += `</ul>`;
            }
            if (aiSummary.confidence) {
                let confidenceColor = "#4caf50";
                if (aiSummary.confidence === "medium") {
                    confidenceColor = "#ff9800";
                }
                else if (aiSummary.confidence === "low") {
                    confidenceColor = "#f44336";
                }
                html += `
          <p style="margin-top: 15px;">
            <strong>Confidence:</strong> 
            <span style="color: ${confidenceColor};">${aiSummary.confidence.toUpperCase()}</span>
          </p>
        `;
            }
            html += `</div>`;
        }
        html += `
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
          <p>This is an automated alert from the NestJS API Monitor.</p>
        </div>
      </div>
    `;
        return { subject, html };
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(injection_tokens_1.API_MONITOR_CONFIG)),
    __metadata("design:paramtypes", [Object])
], EmailService);
//# sourceMappingURL=email.service.js.map