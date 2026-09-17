import { userProfileManager } from "./user-profile-manager.js";
import { CONFIG } from "../../config.js";
import { sortProfileItems } from "../../utils/profile.js";
import { log } from "../logger.js";
function dedupByCategory(items, topN) {
    if (items.length <= topN)
        return items;
    const seen = new Set();
    const result = [];
    for (const item of items) {
        if (seen.has(item.category))
            continue;
        seen.add(item.category);
        result.push(item);
        if (result.length >= topN)
            break;
    }
    return result;
}
function scoreByRecency(items) {
    const now = Date.now();
    return [...items].sort((a, b) => {
        const ageA = (now - (a.lastSeen || 0)) / (24 * 60 * 60 * 1000);
        const ageB = (now - (b.lastSeen || 0)) / (24 * 60 * 60 * 1000);
        const scoreA = (a.confidence || 0) * 0.7 + Math.exp(-ageA / 90) * 0.3;
        const scoreB = (b.confidence || 0) * 0.7 + Math.exp(-ageB / 90) * 0.3;
        return scoreB - scoreA;
    });
}
function escapeXmlText(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
function escapeXmlAttr(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
export async function getUserProfileContext(userId) {
    const profile = await userProfileManager.getActiveProfile(userId);
    if (!profile) {
        return null;
    }
    let profileData;
    try {
        profileData = JSON.parse(profile.profileData);
    }
    catch (e) {
        // A single corrupt row must not break context injection for everyone.
        log("profile context: failed to parse stored profileData", { error: String(e) });
        return null;
    }
    const parts = [];
    const injectPrefs = CONFIG.userProfileInjectPreferences ?? 5;
    const injectPats = CONFIG.userProfileInjectPatterns ?? 5;
    const injectWfs = CONFIG.userProfileInjectWorkflows ?? 3;
    const sortedPrefs = profileData.preferences.length > 0
        ? sortProfileItems(profileData.preferences, "confidence")
        : [];
    const sortedPats = profileData.patterns.length > 0
        ? sortProfileItems(profileData.patterns, "frequency")
        : [];
    const sortedWfs = profileData.workflows.length > 0
        ? sortProfileItems(profileData.workflows, "frequency")
        : [];
    const topPrefs = dedupByCategory(scoreByRecency(sortedPrefs.slice(0, injectPrefs * 2)), injectPrefs);
    const topPats = dedupByCategory(sortedPats, injectPats);
    const topWfs = sortedWfs.slice(0, injectWfs);
    if (topPrefs.length > 0) {
        parts.push("User Preferences:");
        topPrefs.forEach((pref) => {
            parts.push(`- [${pref.category}] ${pref.description}`);
        });
    }
    if (topPats.length > 0) {
        parts.push("\nUser Patterns:");
        topPats.forEach((pattern) => {
            parts.push(`- [${pattern.category}] ${pattern.description}`);
        });
    }
    if (topWfs.length > 0) {
        parts.push("\nUser Workflows:");
        topWfs.forEach((workflow) => {
            const steps = workflow.steps?.length
                ? ` (${workflow.frequency || 1}x: ${workflow.steps.join(" → ")})`
                : ` (${workflow.frequency || 1}x)`;
            parts.push(`- ${workflow.description}${steps}`);
        });
    }
    if (profileData.learning_paths?.length > 0) {
        parts.push("\nLearning Paths:");
        profileData.learning_paths.slice(0, 3).forEach((path) => {
            parts.push(`- ${path.topic}: ${path.description}`);
        });
    }
    if (parts.length === 0) {
        return null;
    }
    const text = parts.join("\n");
    if (topPrefs.length + topPats.length + topWfs.length > 0) {
        log("profile inject", {
            prefs: topPrefs.map((p) => `[${p.category}] ${p.description}`.substring(0, 80)),
            pats: topPats.map((p) => `[${p.category}] ${p.description}`.substring(0, 80)),
            wfs: topWfs.map((w) => w.description.substring(0, 80)),
        });
    }
    return text;
}
