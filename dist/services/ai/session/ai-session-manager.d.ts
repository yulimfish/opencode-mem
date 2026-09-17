import type { AISession, SessionCreateParams, SessionUpdateParams, AIProviderType, AIMessage } from "./session-types.js";
export declare class AISessionManager {
    private db;
    private dbPath;
    private readonly sessionRetentionMs;
    private initPromise;
    constructor();
    reset(): void;
    private initialize;
    private ready;
    private initDatabase;
    getSession(sessionId: string, provider: AIProviderType): Promise<AISession | null>;
    createSession(params: SessionCreateParams): Promise<AISession>;
    updateSession(sessionId: string, provider: AIProviderType, updates: SessionUpdateParams): Promise<void>;
    cleanupExpiredSessions(): Promise<number>;
    deleteSession(sessionId: string, provider: AIProviderType): Promise<void>;
    addMessage(message: Omit<AIMessage, "id" | "createdAt">): Promise<void>;
    getMessages(aiSessionId: string): Promise<AIMessage[]>;
    getLastSequence(aiSessionId: string): Promise<number>;
    clearMessages(aiSessionId: string): Promise<void>;
    private rowToSession;
    private rowToMessage;
}
export declare const aiSessionManager: AISessionManager;
//# sourceMappingURL=ai-session-manager.d.ts.map