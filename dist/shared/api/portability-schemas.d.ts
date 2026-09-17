import { z } from "zod";
export declare const PORTABILITY_SCHEMA_VERSION: 1;
export declare const ExportedMemorySchema: z.ZodObject<{
    id: z.ZodString;
    content: z.ZodString;
    type: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    createdAt: z.ZodNumber;
    updatedAt: z.ZodOptional<z.ZodNumber>;
    isPinned: z.ZodOptional<z.ZodBoolean>;
    isStaged: z.ZodOptional<z.ZodBoolean>;
    source: z.ZodOptional<z.ZodString>;
    authority: z.ZodOptional<z.ZodString>;
    observedAt: z.ZodOptional<z.ZodNumber>;
    validUntil: z.ZodOptional<z.ZodNumber>;
    injectCount: z.ZodOptional<z.ZodNumber>;
    lastInjectedAt: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    displayName: z.ZodOptional<z.ZodString>;
    userName: z.ZodOptional<z.ZodString>;
    userEmail: z.ZodOptional<z.ZodString>;
    projectPath: z.ZodOptional<z.ZodString>;
    projectName: z.ZodOptional<z.ZodString>;
    gitRepoUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const MemoryExportDocumentSchema: z.ZodObject<{
    schemaVersion: z.ZodLiteral<1>;
    exportedAt: z.ZodString;
    plugin: z.ZodObject<{
        package: z.ZodString;
        version: z.ZodString;
    }, z.core.$strip>;
    source: z.ZodObject<{
        containerTag: z.ZodString;
        scope: z.ZodLiteral<"project">;
        scopeHash: z.ZodString;
        projectPath: z.ZodOptional<z.ZodString>;
        projectName: z.ZodOptional<z.ZodString>;
        gitRepoUrl: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    embedding: z.ZodObject<{
        model: z.ZodString;
        dimensions: z.ZodNumber;
    }, z.core.$strip>;
    memories: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        content: z.ZodString;
        type: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        createdAt: z.ZodNumber;
        updatedAt: z.ZodOptional<z.ZodNumber>;
        isPinned: z.ZodOptional<z.ZodBoolean>;
        isStaged: z.ZodOptional<z.ZodBoolean>;
        source: z.ZodOptional<z.ZodString>;
        authority: z.ZodOptional<z.ZodString>;
        observedAt: z.ZodOptional<z.ZodNumber>;
        validUntil: z.ZodOptional<z.ZodNumber>;
        injectCount: z.ZodOptional<z.ZodNumber>;
        lastInjectedAt: z.ZodOptional<z.ZodNumber>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        displayName: z.ZodOptional<z.ZodString>;
        userName: z.ZodOptional<z.ZodString>;
        userEmail: z.ZodOptional<z.ZodString>;
        projectPath: z.ZodOptional<z.ZodString>;
        projectName: z.ZodOptional<z.ZodString>;
        gitRepoUrl: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type ExportedMemory = z.infer<typeof ExportedMemorySchema>;
export type MemoryExportDocument = z.infer<typeof MemoryExportDocumentSchema>;
//# sourceMappingURL=portability-schemas.d.ts.map