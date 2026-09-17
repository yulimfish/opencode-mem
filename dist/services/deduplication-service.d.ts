interface DuplicateGroup {
    representative: {
        id: string;
        content: string;
        containerTag: string;
        createdAt: number;
    };
    duplicates: Array<{
        id: string;
        content: string;
        similarity: number;
    }>;
}
interface DeduplicationResult {
    exactDuplicatesDeleted: number;
    nearDuplicateGroups: DuplicateGroup[];
}
export declare class DeduplicationService {
    private isRunning;
    detectAndRemoveDuplicates(): Promise<DeduplicationResult>;
    getStatus(): {
        enabled: boolean;
        threshold: number;
        isRunning: boolean;
    };
}
export declare const deduplicationService: DeduplicationService;
export {};
//# sourceMappingURL=deduplication-service.d.ts.map