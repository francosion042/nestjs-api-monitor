import { DynamicModule } from "@nestjs/common";
import { ApiMonitorConfig } from "./interfaces/api-monitor-config.interface";
export interface ApiMonitorAsyncOptions {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<ApiMonitorConfig> | ApiMonitorConfig;
    inject?: any[];
}
export declare class ApiMonitorModule {
    static forRoot(config: ApiMonitorConfig): DynamicModule;
    static forRootAsync(options: ApiMonitorAsyncOptions): DynamicModule;
    private static createAsyncProviders;
}
