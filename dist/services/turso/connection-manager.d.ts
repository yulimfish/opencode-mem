import { createClient } from "@libsql/client";
import { TursoDb } from "./turso-db.js";
export declare class TursoConnectionManager {
    private readonly clientFactory;
    private readonly connections;
    private readonly pending;
    private readonly closingConnections;
    private closingPromise;
    constructor(clientFactory?: typeof createClient);
    getConnection(dbPath: string): Promise<TursoDb>;
    closeConnection(dbPath: string): Promise<void>;
    closeAll(): Promise<void>;
    closeAllSync(): void;
}
export declare const tursoConnectionManager: TursoConnectionManager;
//# sourceMappingURL=connection-manager.d.ts.map