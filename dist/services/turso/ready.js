import { runLegacyTursoMigration } from "./legacy-migrator.js";
import { tursoShardManager } from "./shard-manager.js";
import { log } from "../logger.js";
let initPromise = null;
let isReady = false;
export async function ensureTursoReady() {
    if (isReady)
        return;
    if (initPromise)
        return initPromise;
    initPromise = (async () => {
        try {
            await runLegacyTursoMigration();
            const { shardPathMigrationService } = await import("../shard-path-migration-service.js");
            await shardPathMigrationService.recoverInterruptedSwap();
            await tursoShardManager.getAllShards("user", "");
            isReady = true;
        }
        catch (error) {
            initPromise = null;
            log("Turso ready gate failed", { error: String(error) });
            throw error;
        }
    })();
    return initPromise;
}
export function resetTursoReady() {
    isReady = false;
    initPromise = null;
}
