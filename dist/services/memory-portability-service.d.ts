export interface ExportMemoriesOptions {
    currentDirectory: string;
    outputPath: string;
}
export interface ExportMemoriesResult {
    success: boolean;
    outputPath?: string;
    count?: number;
    containerTag?: string;
    scopeHash?: string;
    error?: string;
}
export interface ImportMemoriesOptions {
    currentDirectory: string;
    inputPath: string;
    dryRun?: boolean;
}
export interface ImportMemoriesResult {
    success: boolean;
    dryRun: boolean;
    imported?: number;
    skipped?: Array<{
        id: string;
        reason: string;
    }>;
    rejected?: Array<{
        id: string;
        reason: string;
    }>;
    containerTag?: string;
    error?: string;
}
export declare class MemoryPortabilityService {
    exportMemories(options: ExportMemoriesOptions): Promise<ExportMemoriesResult>;
    importMemories(options: ImportMemoriesOptions): Promise<ImportMemoriesResult>;
}
export declare const memoryPortabilityService: MemoryPortabilityService;
//# sourceMappingURL=memory-portability-service.d.ts.map