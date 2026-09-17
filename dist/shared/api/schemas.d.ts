import { z } from "zod";
/** Envelope used by all JSON API responses. */
export declare const ApiResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodUnknown>;
    error: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const TagInfoSchema: z.ZodObject<{
    tag: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    displayName: z.ZodOptional<z.ZodString>;
    userName: z.ZodOptional<z.ZodString>;
    userEmail: z.ZodOptional<z.ZodString>;
    projectPath: z.ZodOptional<z.ZodString>;
    projectName: z.ZodOptional<z.ZodString>;
    gitRepoUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const MemoryItemSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<{
        memory: "memory";
        prompt: "prompt";
    }>;
    content: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodOptional<z.ZodString>;
    displayName: z.ZodOptional<z.ZodString>;
    projectPath: z.ZodOptional<z.ZodString>;
    projectName: z.ZodOptional<z.ZodString>;
    gitRepoUrl: z.ZodOptional<z.ZodString>;
    userName: z.ZodOptional<z.ZodString>;
    userEmail: z.ZodOptional<z.ZodString>;
    memoryType: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    isPinned: z.ZodOptional<z.ZodBoolean>;
    linkedPromptId: z.ZodOptional<z.ZodString>;
    linkedMemoryId: z.ZodOptional<z.ZodString>;
    sessionId: z.ZodOptional<z.ZodString>;
    similarity: z.ZodOptional<z.ZodNumber>;
    isContext: z.ZodOptional<z.ZodBoolean>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const PaginatedMemoriesSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<{
            memory: "memory";
            prompt: "prompt";
        }>;
        content: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodOptional<z.ZodString>;
        displayName: z.ZodOptional<z.ZodString>;
        projectPath: z.ZodOptional<z.ZodString>;
        projectName: z.ZodOptional<z.ZodString>;
        gitRepoUrl: z.ZodOptional<z.ZodString>;
        userName: z.ZodOptional<z.ZodString>;
        userEmail: z.ZodOptional<z.ZodString>;
        memoryType: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        isPinned: z.ZodOptional<z.ZodBoolean>;
        linkedPromptId: z.ZodOptional<z.ZodString>;
        linkedMemoryId: z.ZodOptional<z.ZodString>;
        sessionId: z.ZodOptional<z.ZodString>;
        similarity: z.ZodOptional<z.ZodNumber>;
        isContext: z.ZodOptional<z.ZodBoolean>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>>;
    total: z.ZodNumber;
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
    totalPages: z.ZodNumber;
}, z.core.$strip>;
export declare const ProfileItemSchema: z.ZodObject<{
    category: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    confidence: z.ZodOptional<z.ZodNumber>;
    frequency: z.ZodOptional<z.ZodNumber>;
    evidence: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodString]>>;
    steps: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const ProfileDataSchema: z.ZodObject<{
    preferences: z.ZodOptional<z.ZodArray<z.ZodObject<{
        category: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        confidence: z.ZodOptional<z.ZodNumber>;
        frequency: z.ZodOptional<z.ZodNumber>;
        evidence: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodString]>>;
        steps: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>>;
    patterns: z.ZodOptional<z.ZodArray<z.ZodObject<{
        category: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        confidence: z.ZodOptional<z.ZodNumber>;
        frequency: z.ZodOptional<z.ZodNumber>;
        evidence: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodString]>>;
        steps: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>>;
    workflows: z.ZodOptional<z.ZodArray<z.ZodObject<{
        category: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        confidence: z.ZodOptional<z.ZodNumber>;
        frequency: z.ZodOptional<z.ZodNumber>;
        evidence: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodString]>>;
        steps: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const UserProfileSchema: z.ZodObject<{
    exists: z.ZodBoolean;
    message: z.ZodOptional<z.ZodString>;
    id: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
    displayName: z.ZodOptional<z.ZodString>;
    userName: z.ZodOptional<z.ZodString>;
    userEmail: z.ZodOptional<z.ZodString>;
    version: z.ZodOptional<z.ZodNumber>;
    totalPromptsAnalyzed: z.ZodOptional<z.ZodNumber>;
    lastAnalyzedAt: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodString>;
    profileData: z.ZodOptional<z.ZodObject<{
        preferences: z.ZodOptional<z.ZodArray<z.ZodObject<{
            category: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            confidence: z.ZodOptional<z.ZodNumber>;
            frequency: z.ZodOptional<z.ZodNumber>;
            evidence: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodString]>>;
            steps: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>>;
        patterns: z.ZodOptional<z.ZodArray<z.ZodObject<{
            category: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            confidence: z.ZodOptional<z.ZodNumber>;
            frequency: z.ZodOptional<z.ZodNumber>;
            evidence: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodString]>>;
            steps: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>>;
        workflows: z.ZodOptional<z.ZodArray<z.ZodObject<{
            category: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            confidence: z.ZodOptional<z.ZodNumber>;
            frequency: z.ZodOptional<z.ZodNumber>;
            evidence: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodString]>>;
            steps: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const CleanupChangesSchema: z.ZodObject<{
    merged: z.ZodOptional<z.ZodArray<z.ZodObject<{
        ids: z.ZodArray<z.ZodString>;
        result: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    removed: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        reason: z.ZodString;
    }, z.core.$strip>>>;
    kept: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const PendingCleanupSchema: z.ZodObject<{
    old: z.ZodOptional<z.ZodObject<{
        preferences: z.ZodOptional<z.ZodArray<z.ZodObject<{
            category: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            confidence: z.ZodOptional<z.ZodNumber>;
            frequency: z.ZodOptional<z.ZodNumber>;
            evidence: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodString]>>;
            steps: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>>;
        patterns: z.ZodOptional<z.ZodArray<z.ZodObject<{
            category: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            confidence: z.ZodOptional<z.ZodNumber>;
            frequency: z.ZodOptional<z.ZodNumber>;
            evidence: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodString]>>;
            steps: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>>;
        workflows: z.ZodOptional<z.ZodArray<z.ZodObject<{
            category: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            confidence: z.ZodOptional<z.ZodNumber>;
            frequency: z.ZodOptional<z.ZodNumber>;
            evidence: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodString]>>;
            steps: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
    new: z.ZodOptional<z.ZodObject<{
        preferences: z.ZodOptional<z.ZodArray<z.ZodObject<{
            category: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            confidence: z.ZodOptional<z.ZodNumber>;
            frequency: z.ZodOptional<z.ZodNumber>;
            evidence: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodString]>>;
            steps: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>>;
        patterns: z.ZodOptional<z.ZodArray<z.ZodObject<{
            category: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            confidence: z.ZodOptional<z.ZodNumber>;
            frequency: z.ZodOptional<z.ZodNumber>;
            evidence: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodString]>>;
            steps: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>>;
        workflows: z.ZodOptional<z.ZodArray<z.ZodObject<{
            category: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            confidence: z.ZodOptional<z.ZodNumber>;
            frequency: z.ZodOptional<z.ZodNumber>;
            evidence: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodString]>>;
            steps: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
    changes: z.ZodObject<{
        merged: z.ZodOptional<z.ZodArray<z.ZodObject<{
            ids: z.ZodArray<z.ZodString>;
            result: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        removed: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            reason: z.ZodString;
        }, z.core.$strip>>>;
        kept: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const AICleanupRequestSchema: z.ZodObject<{
    userId: z.ZodOptional<z.ZodString>;
    includeIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    profileVersion: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const ApplyCleanupRequestSchema: z.ZodObject<{
    userId: z.ZodOptional<z.ZodString>;
    profile: z.ZodOptional<z.ZodObject<{
        preferences: z.ZodOptional<z.ZodArray<z.ZodObject<{
            category: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            confidence: z.ZodOptional<z.ZodNumber>;
            frequency: z.ZodOptional<z.ZodNumber>;
            evidence: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodString]>>;
            steps: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>>;
        patterns: z.ZodOptional<z.ZodArray<z.ZodObject<{
            category: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            confidence: z.ZodOptional<z.ZodNumber>;
            frequency: z.ZodOptional<z.ZodNumber>;
            evidence: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodString]>>;
            steps: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>>;
        workflows: z.ZodOptional<z.ZodArray<z.ZodObject<{
            category: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            confidence: z.ZodOptional<z.ZodNumber>;
            frequency: z.ZodOptional<z.ZodNumber>;
            evidence: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodString]>>;
            steps: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
    acceptedMerged: z.ZodOptional<z.ZodArray<z.ZodArray<z.ZodString>>>;
    acceptedRemoved: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const UpdateProfileItemRequestSchema: z.ZodObject<{
    type: z.ZodEnum<{
        patterns: "patterns";
        preferences: "preferences";
        workflows: "workflows";
    }>;
    index: z.ZodNumber;
    action: z.ZodEnum<{
        delete: "delete";
        edit: "edit";
    }>;
    category: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    steps: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const AddMemoryRequestSchema: z.ZodObject<{
    content: z.ZodString;
    containerTag: z.ZodString;
    type: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    displayName: z.ZodOptional<z.ZodString>;
    userName: z.ZodOptional<z.ZodString>;
    userEmail: z.ZodOptional<z.ZodString>;
    projectPath: z.ZodOptional<z.ZodString>;
    projectName: z.ZodOptional<z.ZodString>;
    gitRepoUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateMemoryRequestSchema: z.ZodObject<{
    content: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const BulkIdsRequestSchema: z.ZodObject<{
    ids: z.ZodArray<z.ZodString>;
    cascade: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
//# sourceMappingURL=schemas.d.ts.map