import type { z } from "zod";
import type { AddMemoryRequestSchema, AICleanupRequestSchema, ApiResultSchema, ApplyCleanupRequestSchema, BulkIdsRequestSchema, CleanupChangesSchema, MemoryItemSchema, PaginatedMemoriesSchema, PendingCleanupSchema, ProfileDataSchema, ProfileItemSchema, TagInfoSchema, UpdateMemoryRequestSchema, UpdateProfileItemRequestSchema, UserProfileSchema } from "./schemas.js";
export type ApiResult<T = unknown> = Omit<z.infer<typeof ApiResultSchema>, "data"> & {
    data?: T;
};
export type TagInfo = z.infer<typeof TagInfoSchema>;
export type MemoryItem = z.infer<typeof MemoryItemSchema>;
export type PaginatedMemories = z.infer<typeof PaginatedMemoriesSchema>;
export type MemoryGroup = {
    isPair: true;
    memory: MemoryItem;
    prompt: MemoryItem;
} | {
    isPair: false;
    type: "memory" | "prompt";
    item: MemoryItem;
};
export type ProfileItem = z.infer<typeof ProfileItemSchema>;
export type ProfileData = z.infer<typeof ProfileDataSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type CleanupChanges = z.infer<typeof CleanupChangesSchema>;
export type PendingCleanup = z.infer<typeof PendingCleanupSchema>;
export type AICleanupRequest = z.infer<typeof AICleanupRequestSchema>;
export type ApplyCleanupRequest = z.infer<typeof ApplyCleanupRequestSchema>;
export type UpdateProfileItemRequest = z.infer<typeof UpdateProfileItemRequestSchema>;
export type AddMemoryRequest = z.infer<typeof AddMemoryRequestSchema>;
export type UpdateMemoryRequest = z.infer<typeof UpdateMemoryRequestSchema>;
export type BulkIdsRequest = z.infer<typeof BulkIdsRequestSchema>;
//# sourceMappingURL=types.d.ts.map