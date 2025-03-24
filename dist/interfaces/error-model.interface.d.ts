export interface RequestDetails {
    method: string;
    url: string;
    params?: Record<string, any>;
    query?: Record<string, any>;
    body?: any;
    headers?: Record<string, string | string[] | undefined>;
    ip?: string;
    timestamp: string;
}
export interface ErrorDetails {
    message: string;
    name: string;
    stack?: string;
    statusCode: number;
    path?: string;
    timestamp: string;
}
export interface ApiErrorModel {
    error: ErrorDetails;
    request: RequestDetails;
    response?: {
        body?: any;
        statusCode: number;
    };
    metadata?: {
        environment?: string;
        service?: string;
        version?: string;
        [key: string]: any;
    };
    aiSummary?: {
        summary: string;
        possibleSolutions?: string[];
        confidence?: "high" | "medium" | "low";
    };
}
