import { NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { ApiMonitorConfig } from "../interfaces/api-monitor-config.interface";
import { ApiMonitorService } from "../services/api-monitor.service";
export declare class ApiMonitorMiddleware implements NestMiddleware {
    private readonly config;
    private readonly apiMonitorService;
    constructor(config: ApiMonitorConfig, apiMonitorService: ApiMonitorService);
    use(req: Request, res: Response, next: NextFunction): void;
    private sanitizeHeaders;
}
