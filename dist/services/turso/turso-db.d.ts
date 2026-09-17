import type { Client, InArgs, ResultSet, Transaction } from "@libsql/client";
type Row = Record<string, unknown>;
export declare class TursoDb {
    private readonly client;
    constructor(client: Client);
    getClient(): Client;
    execute(sql: string, args?: InArgs): Promise<ResultSet>;
    batch(statements: Array<{
        sql: string;
        args?: InArgs;
    }>, mode?: "write" | "read"): Promise<ResultSet[]>;
    get<T extends Row = Row>(sql: string, args?: InArgs): Promise<T | null>;
    all<T extends Row = Row>(sql: string, args?: InArgs): Promise<T[]>;
    run(sql: string, args?: InArgs): Promise<number>;
    transaction<T>(mode: "write" | "read", fn: (tx: Transaction) => Promise<T>): Promise<T>;
    close(): Promise<void>;
}
export {};
//# sourceMappingURL=turso-db.d.ts.map