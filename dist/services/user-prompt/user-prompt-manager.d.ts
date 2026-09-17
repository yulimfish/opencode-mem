export interface UserPrompt {
    id: string;
    sessionId: string;
    messageId: string;
    projectPath: string | null;
    content: string;
    createdAt: number;
    captured: boolean;
    userLearningCaptured: boolean;
    linkedMemoryId: string | null;
    capture_attempts: number;
    providerId: string | null;
    modelId: string | null;
}
export declare class UserPromptManager {
    private db;
    private dbPath;
    private initPromise;
    constructor();
    reset(): void;
    private initialize;
    private ready;
    private initDatabase;
    savePrompt(sessionId: string, messageId: string, projectPath: string, content: string): Promise<string>;
    setPromptModel(messageId: string, providerId: string, modelId: string): Promise<void>;
    getLastUncapturedPrompt(sessionId: string): Promise<UserPrompt | null>;
    getUncapturedPromptsForSession(sessionId: string): Promise<UserPrompt[]>;
    deletePrompt(promptId: string): Promise<void>;
    markAsCaptured(promptId: string): Promise<void>;
    claimPrompt(promptId: string): Promise<boolean>;
    recordFailedAttempt(promptId: string): Promise<void>;
    releaseClaim(promptId: string): Promise<boolean>;
    countUncapturedPrompts(): Promise<number>;
    getUncapturedPrompts(limit: number): Promise<UserPrompt[]>;
    markMultipleAsCaptured(promptIds: string[]): Promise<void>;
    countUnanalyzedForUserLearning(): Promise<number>;
    getPromptsForUserLearning(limit: number): Promise<UserPrompt[]>;
    markAsUserLearningCaptured(promptId: string): Promise<void>;
    markMultipleAsUserLearningCaptured(promptIds: string[]): Promise<void>;
    deleteOldPrompts(cutoffTime: number): Promise<{
        deleted: number;
        linkedMemoryIds: string[];
    }>;
    vacuum(): Promise<void>;
    linkMemoryToPrompt(promptId: string, memoryId: string): Promise<void>;
    getPromptById(promptId: string): Promise<UserPrompt | null>;
    getCapturedPrompts(projectPath?: string): Promise<UserPrompt[]>;
    searchPrompts(query: string, projectPath?: string, limit?: number): Promise<UserPrompt[]>;
    getPromptsByIds(ids: string[]): Promise<UserPrompt[]>;
    updateProjectPath(oldProjectPath: string, newProjectPath: string): Promise<number>;
    private rowToPrompt;
}
export declare const userPromptManager: UserPromptManager;
//# sourceMappingURL=user-prompt-manager.d.ts.map