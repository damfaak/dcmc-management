import { createClient, type Client, type InValue } from '@libsql/client';

let client: Client | undefined;
function connection(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error('TURSO_DATABASE_URL belum diatur.');
  if (process.env.VERCEL && !/^libsql:\/\/|^https:\/\//.test(url)) throw new Error('Vercel memerlukan database remote.');
  if (!client) client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  return client;
}
export class Statement {
  constructor(readonly sql: string, readonly args: InValue[] = []) {}
  bind(...args: any[]) { return new Statement(this.sql, args); }
  async first<T = Record<string, unknown>>(): Promise<T | null> {
    const result = await connection().execute({ sql: this.sql, args: this.args });
    return result.rows.length ? { ...result.rows[0] } as T : null;
  }
  async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
    const result = await connection().execute({ sql: this.sql, args: this.args });
    return { results: result.rows.map(row => ({ ...row }) as T) };
  }
  async run() { return connection().execute({ sql: this.sql, args: this.args }); }
}
export const database = {
  prepare(sql: string) { return new Statement(sql); },
  async batch(statements: Statement[]) {
    // libSQL executes this write batch in one transaction and rolls back on error.
    return connection().batch(statements.map(s => ({ sql: s.sql, args: s.args })), 'write');
  },
};
