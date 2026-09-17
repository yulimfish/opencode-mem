import type { UserProfileData } from "./types.js";
export interface AICleanupResult {
    cleaned: UserProfileData;
    diff: CleanupDiff;
}
export interface CleanupDiff {
    kept: string[];
    merged: Array<{
        ids: string[];
        result: string;
    }>;
    removed: Array<{
        id: string;
        reason: string;
    }>;
}
export declare function aiCleanupProfile(profileData: UserProfileData): Promise<AICleanupResult>;
export declare function aiCleanupProfileFromIndexed(indexed: IndexedProfile): Promise<AICleanupResult>;
export declare function filterProfileForCleanup(profileData: UserProfileData, includeIds: string[]): IndexedProfile;
interface IndexedProfileItem {
    id: string;
    category?: string;
    description: string;
    confidence?: number;
    frequency?: number;
    [key: string]: unknown;
}
interface IndexedProfile {
    preferences: IndexedProfileItem[];
    patterns: IndexedProfileItem[];
    workflows: IndexedProfileItem[];
}
interface AIMapping {
    kept: string[];
    merged: string[][];
    removed: string[];
}
type PromptInfo = {
    error?: {
        name: string;
        data?: {
            message?: string;
        };
    };
};
/**
 * Extract assistant text from an OpenCode session.prompt result.
 * AssistantMessage has no `text` field; content lives in `parts` (#177).
 */
export declare function extractTextFromPromptResult(promptResult: unknown): {
    info: PromptInfo | undefined;
    rawText: string;
};
export declare function rebuildProfileUsing(mapping: AIMapping, cleanedById: Map<string, IndexedProfileItem>, originalById: Map<string, IndexedProfileItem>, counters?: {
    cleaned: number;
    original: number;
}): UserProfileData;
export {};
//# sourceMappingURL=ai-cleanup.d.ts.map