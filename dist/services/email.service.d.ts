import { ApiMonitorConfig } from "../interfaces/api-monitor-config.interface";
import { ApiErrorModel } from "../interfaces/error-model.interface";
export declare class EmailService {
    private readonly config;
    private transporter;
    constructor(config: ApiMonitorConfig);
    sendAlert(errorModel: ApiErrorModel): Promise<void>;
    private formatEmailMessage;
}
