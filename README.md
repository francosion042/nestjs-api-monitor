# NestJS API Monitor

🚀 AI-Powered API Monitoring & Alert Bot as an NPM Library for NestJS

This NestJS middleware will monitor API requests, format errors, and send alerts through Slack, Email, WhatsApp, SMS, or custom Webhooks. It also includes an optional AI feature to summarize errors and suggest possible solutions.

## Features

### ✅ Request Monitoring Middleware
- Automatically tracks incoming requests and responses
- Logs API failures (500, 503, 4xx errors)

### ✅ Error Handling & Formatting
- Standardizes error messages across the application
- Extracts relevant stack traces, request metadata, and affected modules

### ✅ Multi-Channel Alerts
- Sends error alerts via Slack, Email, Twilio (SMS), WhatsApp
- Supports custom webhook-based notifications for external integrations

### ✅ AI-Powered Error Summarization (Optional)
- Uses OpenAI API (GPT) to analyze error logs
- Provides a brief error summary + suggested fixes

### ✅ Customizable Configurations
- Users can enable/disable AI summarization
- Set alert thresholds (e.g., notify only for 5xx errors)
- Choose notification channels dynamically

## Installation

```bash
npm install nestjs-api-monitor
```

## Quick Start

### Step 1: Import the module in your app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { ApiMonitorModule } from 'nestjs-api-monitor';

@Module({
  imports: [
    ApiMonitorModule.forRoot({
      global: true, // Apply globally to all routes
      errorMonitoring: {
        statusCodes: [400, 401, 403, 404, 500, 503], // Status codes to monitor
        includeStackTrace: true,
        includeRequestBody: true,
        includeResponseBody: true,
        includeHeaders: false,
        excludePaths: ['/health', '/metrics'], // Paths to exclude from monitoring
      },
      notifications: {
        slack: {
          enabled: true,
          webhookUrl: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
          channel: '#api-alerts',
          username: 'API Monitor Bot',
          iconEmoji: ':robot_face:',
        },
        email: {
          enabled: true,
          smtp: {
            host: 'smtp.example.com',
            port: 587,
            secure: false,
            auth: {
              user: 'your-email@example.com',
              pass: 'your-password',
            },
          },
          from: 'alerts@example.com',
          to: ['team@example.com'],
          subject: '[API ALERT] Error detected in API',
        },
        twilio: {
          enabled: true,
          accountSid: 'your-account-sid',
          authToken: 'your-auth-token',
          sms: {
            from: '+1234567890',
            to: ['+1987654321'],
          },
          whatsapp: {
            from: 'whatsapp:+1234567890',
            to: ['whatsapp:+1987654321'],
          },
        },
        webhook: {
          enabled: true,
          url: 'https://your-webhook-endpoint.com/api/errors',
          method: 'POST', // GET, POST, PUT, PATCH, DELETE
          headers: {
            'Authorization': 'Bearer YOUR_API_KEY',
            'Content-Type': 'application/json',
          },
        },
      },
      aiSummarization: {
        enabled: true,
        apiKey: 'your-openai-api-key',
        model: 'gpt-4-turbo',
        maxTokens: 350,
        temperature: 0.3,
        maxHistoryLength: 5,
      },
    }),
    // ...other modules
  ],
})
export class AppModule {}
```

### Step 2: Set up the Middleware

For global usage (if `global: true` is set in the config):

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

For specific routes (if `global: false` or not set):

```typescript
// app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ApiMonitorMiddleware, ApiMonitorModule } from 'nestjs-api-monitor';

@Module({
  imports: [
    ApiMonitorModule.forRoot({
      // ...your config
      global: false,
    }),
    // ...other modules
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiMonitorMiddleware)
      .forRoutes('*'); // Apply to all routes, or specify specific routes
  }
}
```

## Advanced Usage

### Using Environment Variables with ConfigService

You can use the `forRootAsync` method to dynamically load configuration from environment variables:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApiMonitorModule } from 'nestjs-api-monitor';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ApiMonitorModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        global: true,
        errorMonitoring: {
          statusCodes: configService.get('ERROR_STATUS_CODES')
            .split(',')
            .map(Number),
          includeStackTrace: configService.get('ERROR_INCLUDE_STACK_TRACE') === 'true',
          includeRequestBody: configService.get('ERROR_INCLUDE_REQUEST_BODY') === 'true',
          includeResponseBody: configService.get('ERROR_INCLUDE_RESPONSE_BODY') === 'true',
          includeHeaders: configService.get('ERROR_INCLUDE_HEADERS') === 'true',
          excludePaths: configService.get('ERROR_EXCLUDE_PATHS')?.split(',') || [],
        },
        notifications: {
          slack: {
            enabled: configService.get('SLACK_ENABLED') === 'true',
            webhookUrl: configService.get('SLACK_WEBHOOK_URL'),
            channel: configService.get('SLACK_CHANNEL'),
            username: configService.get('SLACK_USERNAME'),
            iconEmoji: configService.get('SLACK_ICON_EMOJI'),
          },
          // Other notification configurations...
        },
        aiSummarization: {
          enabled: configService.get('AI_ENABLED') === 'true',
          apiKey: configService.get('OPENAI_API_KEY'),
          model: configService.get('OPENAI_MODEL'),
          maxTokens: parseInt(configService.get('OPENAI_MAX_TOKENS') || '350', 10),
          temperature: parseFloat(configService.get('OPENAI_TEMPERATURE') || '0.3'),
          maxHistoryLength: parseInt(configService.get('ERROR_HISTORY_LENGTH') || '5', 10),
        },
      }),
    }),
  ],
})
export class AppModule {}
```

### Custom Error Transformation

You can customize how errors are transformed before being sent:

```typescript
ApiMonitorModule.forRoot({
  // ...other config
  errorMonitoring: {
    // ...other error monitoring config
    customErrorTransformer: (error, request, response) => {
      // Add custom fields or transform the error
      return {
        metadata: {
          customField: 'custom value',
          serviceVersion: process.env.SERVICE_VERSION,
        },
      };
    },
  },
})
```

### Webhook Integration

You can send error notifications to any external service using the webhook integration:

```typescript
ApiMonitorModule.forRoot({
  // ...other config
  notifications: {
    // ...other notifications
    webhook: {
      enabled: true,
      url: 'https://api.yourservice.com/webhook',
      method: 'POST', // GET, POST, PUT, PATCH, DELETE
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json',
      },
    },
  },
})
```

The webhook payload includes detailed information about the error, request, response, and AI analysis if enabled.

## Notification Examples

### Slack Alert Example

![Slack Alert Example](https://example.com/slack-alert.png)

### Email Alert Example

![Email Alert Example](https://example.com/email-alert.png)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT 