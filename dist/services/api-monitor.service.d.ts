import { ApiMonitorConfig } from "../interfaces/api-monitor-config.interface";
import { SlackService } from "./slack.service";
import { EmailService } from "./email.service";
import { TwilioService } from "./twilio.service";
import { WebhookService } from "./webhook.service";
import { OpenAiService } from "./openai.service";
import { ErrorDetails, RequestDetails } from "../interfaces/error-model.interface";
export declare class ApiMonitorService {
    private readonly config;
    private readonly slackService?;
    private readonly emailService?;
    private readonly twilioService?;
    private readonly webhookService?;
    private readonly openAiService?;
    private errorHistory;
    constructor(config: ApiMonitorConfig, slackService?: SlackService, emailService?: EmailService, twilioService?: TwilioService, webhookService?: WebhookService, openAiService?: OpenAiService);
    processError(error: ErrorDetails, request: RequestDetails, response?: {
        body?: any;
        statusCode: number;
    }): Promise<void>;
    private sendNotifications;
    private updateErrorHistory;
}
