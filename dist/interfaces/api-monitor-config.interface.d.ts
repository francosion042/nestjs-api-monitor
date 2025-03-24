export interface ApiMonitorConfig {
    global?: boolean;
    errorMonitoring: {
        statusCodes: number[];
        includeStackTrace?: boolean;
        includeRequestBody?: boolean;
        includeResponseBody?: boolean;
        includeHeaders?: boolean;
        excludePaths?: string[];
        customErrorTransformer?: (error: any, request?: any, response?: any) => any;
    };
    notifications: {
        slack?: {
            enabled: boolean;
            webhookUrl: string;
            channel?: string;
            username?: string;
            iconEmoji?: string;
            iconUrl?: string;
        };
        email?: {
            enabled: boolean;
            smtp: {
                host: string;
                port: number;
                secure?: boolean;
                auth: {
                    user: string;
                    pass: string;
                };
            };
            from: string;
            to: string[];
            cc?: string[];
            subject?: string;
        };
        twilio?: {
            enabled: boolean;
            accountSid: string;
            authToken: string;
            sms?: {
                from: string;
                to: string[];
            };
            whatsapp?: {
                from: string;
                to: string[];
            };
        };
        webhook?: {
            enabled: boolean;
            url: string;
            method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
            headers?: Record<string, string>;
        };
    };
    aiSummarization?: {
        enabled: boolean;
        apiKey: string;
        model?: string;
        maxTokens?: number;
        temperature?: number;
        maxHistoryLength?: number;
    };
}
