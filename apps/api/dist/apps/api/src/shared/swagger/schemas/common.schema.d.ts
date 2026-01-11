export declare class HealthCheckResponseSchema {
    status: string;
    timestamp: string;
    service: string;
    version: string;
}
export declare class PaginationMetaSchema {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}
export declare class MessageResponseSchema {
    message: string;
}
