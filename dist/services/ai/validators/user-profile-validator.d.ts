import type { UserProfileData } from "../../user-profile/types.js";
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    data?: UserProfileData;
}
export declare class UserProfileValidator {
    static validate(data: any): ValidationResult;
    private static validatePreferences;
    private static validatePatterns;
    private static validateWorkflows;
}
//# sourceMappingURL=user-profile-validator.d.ts.map