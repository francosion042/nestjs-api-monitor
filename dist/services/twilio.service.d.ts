import { ApiMonitorConfig } from "../interfaces/api-monitor-config.interface";
import { ApiErrorModel } from "../interfaces/error-model.interface";
export declare class TwilioService {
    private readonly config;
    private client;
    constructor(config: ApiMonitorConfig);
    sendSmsAlert(errorModel: ApiErrorModel): Promise<void>;
    sendWhatsAppAlert(errorModel: ApiErrorModel): Promise<void>;
    private formatSmsMessage;
    private formatWhatsAppMessage;
}
