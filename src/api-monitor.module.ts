import { DynamicModule, Module, Provider } from "@nestjs/common";
import { ApiMonitorMiddleware } from "./middleware/api-monitor.middleware";
import { SlackService } from "./services/slack.service";
import { EmailService } from "./services/email.service";
import { TwilioService } from "./services/twilio.service";
import { OpenAiService } from "./services/openai.service";
import { WebhookService } from "./services/webhook.service";
import { ApiMonitorConfig } from "./interfaces/api-monitor-config.interface";
import { API_MONITOR_CONFIG } from "./constants/injection-tokens";
import { ApiMonitorService } from "./services/api-monitor.service";

export interface ApiMonitorAsyncOptions {
  imports?: any[];
  useFactory: (...args: any[]) => Promise<ApiMonitorConfig> | ApiMonitorConfig;
  inject?: any[];
}

@Module({})
export class ApiMonitorModule {
  static forRoot(config: ApiMonitorConfig): DynamicModule {
    const providers: Provider[] = [
      {
        provide: API_MONITOR_CONFIG,
        useValue: config,
      },
      ApiMonitorService,
      ApiMonitorMiddleware,
    ];

    // Add notification services based on configuration
    if (config.notifications.slack?.enabled) {
      providers.push(SlackService);
    }

    if (config.notifications.email?.enabled) {
      providers.push(EmailService);
    }

    if (config.notifications.twilio?.enabled) {
      providers.push(TwilioService);
    }

    if (config.notifications.webhook?.enabled) {
      providers.push(WebhookService);
    }

    if (config.aiSummarization?.enabled) {
      providers.push(OpenAiService);
    }

    return {
      module: ApiMonitorModule,
      providers,
      exports: [ApiMonitorMiddleware, ApiMonitorService],
      global: config.global || false,
    };
  }

  static forRootAsync(options: ApiMonitorAsyncOptions): DynamicModule {
    const asyncProviders = this.createAsyncProviders(options);

    return {
      module: ApiMonitorModule,
      imports: options.imports || [],
      providers: [
        ...asyncProviders,
        ApiMonitorService,
        ApiMonitorMiddleware,
        {
          provide: SlackService,
          useFactory: (config: ApiMonitorConfig) => {
            return config.notifications.slack?.enabled ? new SlackService(config) : null;
          },
          inject: [API_MONITOR_CONFIG],
        },
        {
          provide: EmailService,
          useFactory: (config: ApiMonitorConfig) => {
            return config.notifications.email?.enabled ? new EmailService(config) : null;
          },
          inject: [API_MONITOR_CONFIG],
        },
        {
          provide: TwilioService,
          useFactory: (config: ApiMonitorConfig) => {
            return config.notifications.twilio?.enabled ? new TwilioService(config) : null;
          },
          inject: [API_MONITOR_CONFIG],
        },
        {
          provide: WebhookService,
          useFactory: (config: ApiMonitorConfig) => {
            return config.notifications.webhook?.enabled ? new WebhookService(config) : null;
          },
          inject: [API_MONITOR_CONFIG],
        },
        {
          provide: OpenAiService,
          useFactory: (config: ApiMonitorConfig) => {
            return config.aiSummarization?.enabled ? new OpenAiService(config) : null;
          },
          inject: [API_MONITOR_CONFIG],
        },
      ],
      exports: [ApiMonitorMiddleware, ApiMonitorService],
      global: true, // Will be overridden by the actual config once resolved
    };
  }

  private static createAsyncProviders(options: ApiMonitorAsyncOptions): Provider[] {
    return [
      {
        provide: API_MONITOR_CONFIG,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory(...args);
          return config;
        },
        inject: options.inject || [],
      },
    ];
  }
}
