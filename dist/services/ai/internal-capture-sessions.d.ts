/** Title used for transient structured-output sessions (capture / profile learning). */
export declare const INTERNAL_CAPTURE_SESSION_TITLE = "opencode-mem capture";
export declare function isInternalCaptureSessionTitle(title: string | undefined | null): boolean;
export declare function trackInternalCaptureSession(sessionID: string): void;
export declare function untrackInternalCaptureSession(sessionID: string): void;
export declare function isTrackedInternalCaptureSession(sessionID: string): boolean;
//# sourceMappingURL=internal-capture-sessions.d.ts.map