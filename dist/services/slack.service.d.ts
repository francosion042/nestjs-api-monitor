import { ApiMonitorConfig } from "../interfaces/api-monitor-config.interface";
import { ApiErrorModel } from "../interfaces/error-model.interface";
export declare class SlackService {
    private readonly config;
    constructor(config: ApiMonitorConfig);
    sendAlert(errorModel: ApiErrorModel): Promise<void>;
    private formatSlackMessage;
}
