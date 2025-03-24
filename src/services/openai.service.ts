import { Inject, Injectable } from "@nestjs/common";
import { API_MONITOR_CONFIG } from "../constants/injection-tokens";
import { ApiMonitorConfig } from "../interfaces/api-monitor-config.interface";
import { ApiErrorModel } from "../interfaces/error-model.interface";
import OpenAI from "openai";

@Injectable()
export class OpenAiService {
  private openai: OpenAI;

  constructor(
    @Inject(API_MONITOR_CONFIG) private readonly config: ApiMonitorConfig
  ) {
    // Initialize OpenAI client if AI summarization is enabled
    if (this.config.aiSummarization?.enabled) {
      this.openai = new OpenAI({
        apiKey: this.config.aiSummarization.apiKey,
      });
    }
  }

  /**
   * Analyze an error using OpenAI to provide insights and possible solutions
   */
  async analyzeError(
    currentError: ApiErrorModel,
    errorHistory: ApiErrorModel[]
  ): Promise<{
    summary: string;
    possibleSolutions?: string[];
    confidence?: "high" | "medium" | "low";
  }> {
    if (!this.config.aiSummarization?.enabled || !this.openai) {
      return { summary: "AI analysis not available" };
    }

    try {
      // Prepare the prompt for OpenAI with error context
      const prompt = this.buildErrorAnalysisPrompt(currentError, errorHistory);

      // Call OpenAI API
      const response = await this.openai.chat.completions.create({
        model: this.config.aiSummarization.model || "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are an expert API error analyzer. Your task is to analyze API errors, identify the root cause, and suggest possible solutions. Be concise but informative.",
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

      // Parse the OpenAI response
      const responseText = response.choices[0]?.message?.content || "{}";
      const parsedResponse = JSON.parse(responseText);

      return {
        summary: parsedResponse.summary || "Unable to generate summary",
        possibleSolutions: parsedResponse.possibleSolutions || [],
        confidence: parsedResponse.confidence || "medium",
      };
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      return { summary: "Failed to perform AI analysis due to API error" };
    }
  }

  /**
   * Build a comprehensive prompt for error analysis
   */
  private buildErrorAnalysisPrompt(
    currentError: ApiErrorModel,
    errorHistory: ApiErrorModel[]
  ): string {
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

    // Add stack trace if available
    if (
      currentError.error.stack &&
      this.config.errorMonitoring.includeStackTrace
    ) {
      prompt += `\nStack Trace:\n${currentError.error.stack}\n`;
    }

    // Add request details
    prompt += "\nRequest Details:\n";
    if (
      currentError.request.params &&
      Object.keys(currentError.request.params).length > 0
    ) {
      prompt += `Parameters: ${JSON.stringify(currentError.request.params)}\n`;
    }
    if (
      currentError.request.query &&
      Object.keys(currentError.request.query).length > 0
    ) {
      prompt += `Query: ${JSON.stringify(currentError.request.query)}\n`;
    }
    if (
      currentError.request.body &&
      this.config.errorMonitoring.includeRequestBody
    ) {
      prompt += `Request Body: ${JSON.stringify(currentError.request.body)}\n`;
    }

    // Add response body if available
    if (
      currentError.response?.body &&
      this.config.errorMonitoring.includeResponseBody
    ) {
      prompt += `\nResponse Body: ${JSON.stringify(
        currentError.response.body
      )}\n`;
    }

    // Add error history for context if available
    if (errorHistory.length > 1) {
      prompt += "\nRecent Error History (for context):\n";

      // Add up to the last 5 errors (excluding the current one)
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
}
