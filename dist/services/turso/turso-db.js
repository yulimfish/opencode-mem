export class TursoDb {
    client;
    constructor(client) {
        this.client = client;
    }
    getClient() {
        return this.client;
    }
    async execute(sql, args) {
        return this.client.execute({ sql, args: args ?? [] });
    }
    async batch(statements, mode = "write") {
        return this.client.batch(statements.map((statement) => ({
            sql: statement.sql,
            args: statement.args ?? [],
        })), mode);
    }
    async get(sql, args) {
        const result = await this.execute(sql, args);
        return result.rows[0] ?? null;
    }
    async all(sql, args) {
        const result = await this.execute(sql, args);
        return result.rows;
    }
    async run(sql, args) {
        const result = await this.execute(sql, args);
        return Number(result.rowsAffected ?? 0);
    }
    async transaction(mode, fn) {
        const tx = await this.client.transaction(mode);
        try {
            const value = await fn(tx);
            await tx.commit();
            return value;
        }
        catch (error) {
            try {
                await tx.rollback();
            }
            catch {
                // ignore rollback errors after a failed statement / already-closed tx
            }
            throw error;
        }
        finally {
            tx.close();
        }
    }
    async close() {
        this.client.close();
    }
}
