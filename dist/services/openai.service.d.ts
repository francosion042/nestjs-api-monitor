import { ApiMonitorConfig } from "../interfaces/api-monitor-config.interface";
import { ApiErrorModel } from "../interfaces/error-model.interface";
export declare class OpenAiService {
    private readonly config;
    private openai;
    constructor(config: ApiMonitorConfig);
    analyzeError(currentError: ApiErrorModel, errorHistory: ApiErrorModel[]): Promise<{
        summary: string;
        possibleSolutions?: string[];
        confidence?: "high" | "medium" | "low";
    }>;
    private buildErrorAnalysisPrompt;
}
