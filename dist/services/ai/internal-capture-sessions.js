/** Title used for transient structured-output sessions (capture / profile learning). */
export const INTERNAL_CAPTURE_SESSION_TITLE = "opencode-mem capture";
/** Grace period so session.idle can still match after best-effort delete. */
const UNTRACK_GRACE_MS = 60_000;
const trackedSessionIDs = new Set();
const untrackTimers = new Map();
export function isInternalCaptureSessionTitle(title) {
    return title === INTERNAL_CAPTURE_SESSION_TITLE;
}
export function trackInternalCaptureSession(sessionID) {
    const pending = untrackTimers.get(sessionID);
    if (pending) {
        clearTimeout(pending);
        untrackTimers.delete(sessionID);
    }
    trackedSessionIDs.add(sessionID);
}
export function untrackInternalCaptureSession(sessionID) {
    const pending = untrackTimers.get(sessionID);
    if (pending) {
        clearTimeout(pending);
    }
    const timer = setTimeout(() => {
        trackedSessionIDs.delete(sessionID);
        untrackTimers.delete(sessionID);
    }, UNTRACK_GRACE_MS);
    untrackTimers.set(sessionID, timer);
}
export function isTrackedInternalCaptureSession(sessionID) {
    return trackedSessionIDs.has(sessionID);
}
