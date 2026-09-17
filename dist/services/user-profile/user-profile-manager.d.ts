import type { UserProfile, UserProfileChangelog, UserProfileData } from "./types.js";
import { EmbeddingService } from "../embedding.js";
export declare class UserProfileManager {
    private db;
    private dbPath;
    private initPromise;
    private coldBuffers;
    private coldBufferPath;
    private dedupCheckedCache;
    constructor();
    reset(): void;
    private initialize;
    private ready;
    private emptyColdBuffer;
    private getColdBuffer;
    private loadColdBuffers;
    private saveColdBuffers;
    private initDatabase;
    getActiveProfile(userId: string): Promise<UserProfile | null>;
    createProfile(userId: string, displayName: string, userName: string, userEmail: string, profileData: UserProfileData, promptsAnalyzed: number): Promise<string>;
    updateProfile(profileId: string, profileData: UserProfileData, additionalPromptsAnalyzed: number, changeSummary: string): Promise<boolean>;
    private addChangelog;
    private cleanupOldChangelogs;
    getProfileChangelogs(profileId: string, limit?: number): Promise<UserProfileChangelog[]>;
    getChangelogById(id: string): Promise<UserProfileChangelog | undefined>;
    decayInMemory(data: UserProfileData): {
        data: UserProfileData;
        hasChanges: boolean;
    };
    private decayItems;
    deleteProfile(profileId: string): Promise<void>;
    getProfileById(profileId: string): Promise<UserProfile | null>;
    getAllActiveProfiles(): Promise<UserProfile[]>;
    private rowToProfile;
    private rowToChangelog;
    mergeProfileData(existing: UserProfileData, updates: Partial<UserProfileData>, embedService?: EmbeddingService, profileId?: string): Promise<UserProfileData>;
    private mergeItems;
    /**
     * Merge a new confirmed observation into an existing profile entry.
     * ONLY call for confirmed matches (exact, strong sameCat/crossCat, Thompson upgrade).
     * Do NOT call for forced merge or cross-validation — those handle fields directly.
     */
    private mergeConfirmedMatch;
    private initItem;
    /**
     * Three-way merge: item1 + item2 + newItem → single combined entry.
     * Called when top-1 and top-2 both strongly match the same new observation
     * within the same category, confirming they describe the same behavior.
     */
    private combineThree;
    private ensureArray;
    private isMilestone;
    private minEvidenceForEvolve;
    syncConfidence(item: any): void;
    private lazyMigrateAlpha;
    private detectConflicts;
    private checkSemanticDuplicate;
    private deduplicateItems;
    private checkConflict;
    private evolveDescription;
    evolveAndUpdate(item: any, itemType: string, profileId?: string): Promise<void>;
    private callOpencodeProvider;
    private callExternalAPI;
}
export declare const userProfileManager: UserProfileManager;
//# sourceMappingURL=user-profile-manager.d.ts.map