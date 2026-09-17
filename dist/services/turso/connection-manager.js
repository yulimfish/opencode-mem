import { createClient } from "@libsql/client";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve, relative, isAbsolute, sep } from "node:path";
import { CONFIG } from "../../config.js";
import { log } from "../logger.js";
import { collectReleasedSqliteHandles } from "./sqlite-handle-release.js";
import { TursoDb } from "./turso-db.js";
function toFileUrl(dbPath) {
    return dbPath.startsWith("file:") ? dbPath : `file:${dbPath}`;
}
function assertPathInsideStorage(dbPath) {
    const storageRoot = resolve(CONFIG.storagePath);
    const resolvedPath = resolve(dbPath);
    const relativePath = relative(storageRoot, resolvedPath);
    // Only treat path-segment traversal as escape (not filenames containing "..").
    if (relativePath === ".." || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
        throw new Error(`Refusing to open database outside storagePath: ${dbPath}`);
    }
}
export class TursoConnectionManager {
    clientFactory;
    connections = new Map();
    pending = new Map();
    closingConnections = new Map();
    closingPromise = null;
    constructor(clientFactory = createClient) {
        this.clientFactory = clientFactory;
    }
    async getConnection(dbPath) {
        if (this.closingPromise) {
            await this.closingPromise;
        }
        const closingConnection = this.closingConnections.get(dbPath);
        if (closingConnection) {
            await closingConnection;
        }
        assertPathInsideStorage(dbPath);
        const existing = this.connections.get(dbPath);
        if (existing) {
            return existing;
        }
        const inFlight = this.pending.get(dbPath);
        if (inFlight) {
            return inFlight;
        }
        const openPromise = (async () => {
            const dir = dirname(dbPath);
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }
            const client = this.clientFactory({ url: toFileUrl(dbPath) });
            try {
                const db = new TursoDb(client);
                await db.execute("PRAGMA foreign_keys = ON");
                this.connections.set(dbPath, db);
                return db;
            }
            catch (error) {
                try {
                    client.close();
                }
                catch {
                    // ignore close errors during cleanup
                }
                throw error;
            }
        })();
        this.pending.set(dbPath, openPromise);
        try {
            return await openPromise;
        }
        catch (error) {
            this.connections.delete(dbPath);
            throw error;
        }
        finally {
            this.pending.delete(dbPath);
        }
    }
    async closeConnection(dbPath) {
        if (this.closingPromise) {
            await this.closingPromise;
        }
        const existingClose = this.closingConnections.get(dbPath);
        if (existingClose) {
            return existingClose;
        }
        const closePromise = Promise.resolve()
            .then(async () => {
            const pending = this.pending.get(dbPath);
            if (pending) {
                await Promise.allSettled([pending]);
            }
            const db = this.connections.get(dbPath);
            if (db) {
                try {
                    await db.close();
                }
                catch (error) {
                    log("Error closing Turso database", { path: dbPath, error: String(error) });
                }
                this.connections.delete(dbPath);
            }
            await collectReleasedSqliteHandles();
        })
            .finally(() => {
            this.closingConnections.delete(dbPath);
        });
        this.closingConnections.set(dbPath, closePromise);
        return closePromise;
    }
    async closeAll() {
        if (this.closingPromise)
            return this.closingPromise;
        this.closingPromise = (async () => {
            await Promise.allSettled([...this.pending.values(), ...this.closingConnections.values()]);
            for (const [path, db] of this.connections) {
                try {
                    await db.close();
                }
                catch (error) {
                    log("Error closing Turso database", { path, error: String(error) });
                }
            }
            this.connections.clear();
            this.pending.clear();
            await collectReleasedSqliteHandles();
        })();
        try {
            await this.closingPromise;
        }
        finally {
            this.closingPromise = null;
        }
    }
    closeAllSync() {
        for (const [path, db] of this.connections) {
            try {
                db.getClient().close();
            }
            catch (error) {
                log("Error closing Turso database (sync)", { path, error: String(error) });
            }
        }
        this.connections.clear();
        this.pending.clear();
    }
}
export const tursoConnectionManager = new TursoConnectionManager();
