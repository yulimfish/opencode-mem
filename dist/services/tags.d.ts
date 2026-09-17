/**
 * Walk up from `directory` (inclusive) to the filesystem root looking for the
 * {@link PROJECT_MARKER}. Returns the first directory that contains it, or
 * `null` when no marker is found so the caller can fall back to git detection.
 */
export declare function findMarkerProjectRoot(directory: string): string | null;
export interface TagInfo {
    tag: string;
    displayName: string;
    userName?: string;
    userEmail?: string;
    projectPath?: string;
    projectName?: string;
    gitRepoUrl?: string;
}
export declare function getGitEmail(directory?: string): string | null;
export declare function getGitName(directory?: string): string | null;
export declare function getGitRepoUrl(directory: string): string | null;
export declare function getGitCommonDir(directory: string): string | null;
export declare function getGitTopLevel(directory: string): string | null;
export declare function getProjectRoot(directory: string): string;
export declare function getProjectIdentity(directory: string): string;
export declare function getProjectName(directory: string): string;
export declare function getUserTagInfo(directory?: string): TagInfo;
export declare function getProjectTagInfo(directory: string): TagInfo;
export declare function getTags(directory: string): {
    user: TagInfo;
    project: TagInfo;
};
//# sourceMappingURL=tags.d.ts.map