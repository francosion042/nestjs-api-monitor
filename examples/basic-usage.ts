// Example NestJS App Module with API Monitor integration

import { Module } from '@nestjs/common';
import { ApiMonitorModule } from 'nestjs-api-monitor';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // Configure API Monitor
    ApiMonitorModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        global: true,
        errorMonitoring: {
          statusCodes: [400, 401, 403, 404, 500, 503],
          includeStackTrace: true,
          includeRequestBody: true,
          includeResponseBody: true,
          includeHeaders: false,
          excludePaths: ['/health', '/metrics'],
        },
        notifications: {
          slack: {
            enabled: configService.get('SLACK_ENABLED') === 'true',
            webhookUrl: configService.get('SLACK_WEBHOOK_URL'),
            channel: configService.get('SLACK_CHANNEL'),
            username: 'API Monitor',
            iconEmoji: ':robot_face:',
          },
          email: {
            enabled: configService.get('EMAIL_ENABLED') === 'true',
            smtp: {
              host: configService.get('EMAIL_HOST'),
              port: parseInt(configService.get('EMAIL_PORT'), 10),
              secure: configService.get('EMAIL_SECURE') === 'true',
              auth: {
                user: configService.get('EMAIL_USER'),
                pass: configService.get('EMAIL_PASS'),
              },
            },
            from: configService.get('EMAIL_FROM'),
            to: [configService.get('EMAIL_TO')],
            subject: '[API ALERT] Error detected in API',
          },
          twilio: {
            enabled: configService.get('TWILIO_ENABLED') === 'true',
            accountSid: configService.get('TWILIO_ACCOUNT_SID'),
            authToken: configService.get('TWILIO_AUTH_TOKEN'),
            sms: {
              from: configService.get('TWILIO_PHONE_NUMBER'),
              to: [configService.get('TWILIO_TO_PHONE_NUMBER')],
            },
            whatsapp: {
              from: `whatsapp:${configService.get('TWILIO_PHONE_NUMBER')}`,
              to: [`whatsapp:${configService.get('TWILIO_TO_PHONE_NUMBER')}`],
            },
          },
        },
        aiSummarization: {
          enabled: configService.get('AI_ENABLED') === 'true',
          apiKey: configService.get('OPENAI_API_KEY'),
          model: configService.get('OPENAI_MODEL') || 'gpt-4-turbo',
          maxTokens: parseInt(configService.get('OPENAI_MAX_TOKENS') || '350', 10),
          temperature: parseFloat(configService.get('OPENAI_TEMPERATURE') || '0.3'),
          maxHistoryLength: parseInt(configService.get('ERROR_HISTORY_LENGTH') || '5', 10),
        },
      }),
    }),
    
    // Other modules
    // ...
  ],
})
export class AppModule {} 