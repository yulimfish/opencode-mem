import type { PluginInput } from "../index.js";
export declare function shouldRunAutomaticProfileCleanup(previousPromptCount: number, addedPromptCount: number, interval?: number): boolean;
export declare function performUserProfileLearning(ctx: PluginInput, directory: string): Promise<void>;
/** Upper bound for LLM-inferred preference confidence (0–1 scale). */
export declare const USER_PROFILE_LLM_CONFIDENCE_MAX = 1;
/** Shared analysis schema for OpenCode structured output and external tool calls. */
export declare function createUserProfileAnalysisSchema(z: typeof import("zod").z): import("zod").ZodObject<{
    preferences: import("zod").ZodArray<import("zod").ZodObject<{
        category: import("zod").ZodString;
        description: import("zod").ZodString;
        confidence: import("zod").ZodNumber;
        evidence: import("zod").ZodArray<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>>;
    patterns: import("zod").ZodArray<import("zod").ZodObject<{
        category: import("zod").ZodString;
        description: import("zod").ZodString;
    }, import("zod/v4/core").$strip>>;
    workflows: import("zod").ZodArray<import("zod").ZodObject<{
        description: import("zod").ZodString;
        steps: import("zod").ZodArray<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>>;
    validations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
        index: import("zod").ZodNumber;
        verdict: import("zod").ZodEnum<{
            confirmed: "confirmed";
            contradicted: "contradicted";
            inaccurate: "inaccurate";
            no_evidence: "no_evidence";
            oversimplified: "oversimplified";
        }>;
        reason: import("zod").ZodString;
    }, import("zod/v4/core").$strip>>>;
}, import("zod/v4/core").$strip>;
export declare function createUserProfileToolSchema(existingProfile: boolean): {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                preferences: {
                    type: string;
                    items: {
                        type: string;
                        properties: {
                            category: {
                                type: string;
                            };
                            description: {
                                type: string;
                            };
                            confidence: {
                                type: string;
                                minimum: number;
                                maximum: number;
                            };
                            evidence: {
                                type: string;
                                items: {
                                    type: string;
                                };
                                maxItems: number;
                            };
                        };
                        required: string[];
                    };
                };
                patterns: {
                    type: string;
                    items: {
                        type: string;
                        properties: {
                            category: {
                                type: string;
                            };
                            description: {
                                type: string;
                            };
                        };
                        required: string[];
                    };
                };
                workflows: {
                    type: string;
                    items: {
                        type: string;
                        properties: {
                            description: {
                                type: string;
                            };
                            steps: {
                                type: string;
                                items: {
                                    type: string;
                                };
                            };
                        };
                        required: string[];
                    };
                };
                validations: {
                    type: string;
                    items: {
                        type: string;
                        properties: {
                            index: {
                                type: string;
                            };
                            verdict: {
                                type: string;
                                enum: string[];
                            };
                            reason: {
                                type: string;
                            };
                        };
                        required: string[];
                    };
                };
            };
            required: string[];
        };
    };
};
//# sourceMappingURL=user-memory-learning.d.ts.map