interface MemoryResultMinimal {
    similarity: number;
    memory?: string;
    chunk?: string;
}
interface MemoriesResponseMinimal {
    results?: MemoryResultMinimal[];
}
export declare function formatContextForPrompt(userId: string | null, projectMemories: MemoriesResponseMinimal): Promise<string>;
export {};
//# sourceMappingURL=context.d.ts.map