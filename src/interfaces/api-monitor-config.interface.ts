export interface ApiMonitorConfig {
  // Global setting to apply the module globally
  global?: boolean;

  // Settings for error monitoring
  errorMonitoring: {
    // HTTP status codes to monitor (e.g., [400, 401, 403, 404, 500, 503])
    statusCodes: number[];
    // Include stack trace in the error report
    includeStackTrace?: boolean;
    // Include request body in the error report (be cautious with sensitive data)
    includeRequestBody?: boolean;
    // Include response body in the error report
    includeResponseBody?: boolean;
    // Include headers in the error report (be cautious with sensitive data)
    includeHeaders?: boolean;
    // Whether to skip certain paths from monitoring (e.g., health checks)
    excludePaths?: string[];
    // Custom handler for error transformation
    customErrorTransformer?: (error: any, request?: any, response?: any) => any;
  };

  // Notification settings
  notifications: {
    // Slack notification settings
    slack?: {
      enabled: boolean;
      webhookUrl: string;
      channel?: string;
      username?: string;
      iconEmoji?: string;
      iconUrl?: string;
    };

    // Email notification settings
    email?: {
      enabled: boolean;
      // SMTP settings
      smtp: {
        host: string;
        port: number;
        secure?: boolean;
        auth: {
          user: string;
          pass: string;
        };
      };
      // Email settings
      from: string;
      to: string[];
      cc?: string[];
      subject?: string;
    };

    // Twilio (SMS/WhatsApp) notification settings
    twilio?: {
      enabled: boolean;
      accountSid: string;
      authToken: string;
      // For SMS
      sms?: {
        from: string;
        to: string[];
      };
      // For WhatsApp
      whatsapp?: {
        from: string; // Should include the "whatsapp:" prefix
        to: string[]; // Should include the "whatsapp:" prefix
      };
    };

    // Webhook notification settings
    webhook?: {
      enabled: boolean;
      url: string;
      method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      headers?: Record<string, string>;
    };
  };

  // AI summarization settings using OpenAI
  aiSummarization?: {
    enabled: boolean;
    apiKey: string;
    model?: string; // Default: "gpt-4-turbo"
    maxTokens?: number; // Default: 150
    temperature?: number; // Default: 0.3
    maxHistoryLength?: number; // Default: 5 - Number of past errors to include as context
  };
}
