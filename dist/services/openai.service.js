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
exports.OpenAiService = void 0;
const common_1 = require("@nestjs/common");
const injection_tokens_1 = require("../constants/injection-tokens");
const openai_1 = require("openai");
let OpenAiService = class OpenAiService {
    constructor(config) {
        var _a;
        this.config = config;
        if ((_a = this.config.aiSummarization) === null || _a === void 0 ? void 0 : _a.enabled) {
            this.openai = new openai_1.default({
                apiKey: this.config.aiSummarization.apiKey,
            });
        }
    }
    async analyzeError(currentError, errorHistory) {
        var _a, _b, _c;
        if (!((_a = this.config.aiSummarization) === null || _a === void 0 ? void 0 : _a.enabled) || !this.openai) {
            return { summary: "AI analysis not available" };
        }
        try {
            const prompt = this.buildErrorAnalysisPrompt(currentError, errorHistory);
            const response = await this.openai.chat.completions.create({
                model: this.config.aiSummarization.model || "gpt-4-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert API error analyzer. Your task is to analyze API errors, identify the root cause, and suggest possible solutions. Be concise but informative.",
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                max_tokens: this.config.aiSummarization.maxTokens || 350,
                temperature: this.config.aiSummarization.temperature || 0.3,
                response_format: { type: "json_object" },
            });
            const responseText = ((_c = (_b = response.choices[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) || "{}";
            const parsedResponse = JSON.parse(responseText);
            return {
                summary: parsedResponse.summary || "Unable to generate summary",
                possibleSolutions: parsedResponse.possibleSolutions || [],
                confidence: parsedResponse.confidence || "medium",
            };
        }
        catch (error) {
            console.error("Error calling OpenAI API:", error);
            return { summary: "Failed to perform AI analysis due to API error" };
        }
    }
    buildErrorAnalysisPrompt(currentError, errorHistory) {
        var _a;
        let prompt = `
Please analyze this API error and provide the following in JSON format:
1. A concise summary of what went wrong (1-2 sentences)
2. A list of possible solutions (up to 3)
3. A confidence level for your analysis ('high', 'medium', or 'low')

Return ONLY a JSON object with the following structure:
{
  "summary": "your error summary here",
  "possibleSolutions": ["solution 1", "solution 2", "solution 3"],
  "confidence": "high|medium|low"
}

Current error details:
Status Code: ${currentError.error.statusCode}
Error Name: ${currentError.error.name}
Error Message: ${currentError.error.message}
Endpoint: ${currentError.request.method} ${currentError.request.url}
`;
        if (currentError.error.stack &&
            this.config.errorMonitoring.includeStackTrace) {
            prompt += `\nStack Trace:\n${currentError.error.stack}\n`;
        }
        prompt += "\nRequest Details:\n";
        if (currentError.request.params &&
            Object.keys(currentError.request.params).length > 0) {
            prompt += `Parameters: ${JSON.stringify(currentError.request.params)}\n`;
        }
        if (currentError.request.query &&
            Object.keys(currentError.request.query).length > 0) {
            prompt += `Query: ${JSON.stringify(currentError.request.query)}\n`;
        }
        if (currentError.request.body &&
            this.config.errorMonitoring.includeRequestBody) {
            prompt += `Request Body: ${JSON.stringify(currentError.request.body)}\n`;
        }
        if (((_a = currentError.response) === null || _a === void 0 ? void 0 : _a.body) &&
            this.config.errorMonitoring.includeResponseBody) {
            prompt += `\nResponse Body: ${JSON.stringify(currentError.response.body)}\n`;
        }
        if (errorHistory.length > 1) {
            prompt += "\nRecent Error History (for context):\n";
            const recentErrors = errorHistory
                .filter((error) => error !== currentError)
                .slice(-5);
            recentErrors.forEach((error, index) => {
                prompt += `\nPrevious Error ${index + 1}:\n`;
                prompt += `Status: ${error.error.statusCode} - ${error.error.name}\n`;
                prompt += `Message: ${error.error.message}\n`;
                prompt += `Endpoint: ${error.request.method} ${error.request.url}\n`;
                prompt += `Time: ${error.error.timestamp}\n`;
            });
        }
        return prompt;
    }
};
exports.OpenAiService = OpenAiService;
exports.OpenAiService = OpenAiService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(injection_tokens_1.API_MONITOR_CONFIG)),
    __metadata("design:paramtypes", [Object])
], OpenAiService);
//# sourceMappingURL=openai.service.js.map