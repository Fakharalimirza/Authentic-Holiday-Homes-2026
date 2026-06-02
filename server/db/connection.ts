import mysql from 'mysql2/promise';
import { initDbTables, isDbInitialized } from './schema';
import { runLocalSqlQuery } from './localDb';

let pool: mysql.Pool | null = null;
let mySqlActiveCached: boolean | null = null;
let lastChecked = 0;
let lastMySqlError: string | null = null;

/**
 * Retrieves the active MySQL connection pool.
 * Gracefully returns null if DB_HOST is not defined in the environment.
 */
export async function getDbPool(): Promise<mysql.Pool | null> {
  if (pool) {
    if (!isDbInitialized() && process.env.DB_HOST) {
      initDbTables(pool).catch(() => {});
    }
    return pool;
  }
  
  if (!process.env.DB_HOST) {
    return null;
  }

  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 15,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000
    });
    
    initDbTables(pool).catch(() => {});
    return pool;
  } catch (err) {
    console.error("[MySQL Pool] Failed to create connection pool: ", err);
    return null;
  }
}

/**
 * Helper to safely run an SQL query with high-reliability automatic Local Fallback
 */
export async function query(sql: string, params?: any[]): Promise<any> {
  const safeParams = params ? params.map(val => val === undefined ? null : val) : [];
  const active = await isMySqlActive();
  if (active) {
    try {
      const p = await getDbPool();
      if (p) {
        const [results] = await p.execute(sql, safeParams);
        return results;
      }
    } catch (err: any) {
      console.warn("[MySQL Exception] Connection timed out or query failed, active failover to local JSON database:", err.message);
      if (err.message && (
        err.message.includes("connect") ||
        err.message.includes("ETIMEDOUT") ||
        err.message.includes("timeout") ||
        err.message.includes("ECONN") ||
        err.message.includes("lost connection") ||
        err.message.includes("handshake") ||
        err.message.includes("protocol")
      )) {
        mySqlActiveCached = false;
        lastChecked = Date.now();
        lastMySqlError = err.message;
      }
    }
  }

  // Gracefully fallback to Local JSON Sandbox Database
  return runLocalSqlQuery(sql, safeParams);
}

export function getLastMySqlError(): string | null {
  return lastMySqlError;
}

/**
 * Verifies if the MySQL adapter is active and connects successfully.
 */
export async function isMySqlActive(): Promise<boolean> {
  if (!process.env.DB_HOST) {
    lastMySqlError = "DB_HOST environment variable is not defined.";
    return false;
  }
  
  const now = Date.now();
  if (mySqlActiveCached !== null && (now - lastChecked < 8000)) {
    return mySqlActiveCached;
  }
  
  try {
    const p = await getDbPool();
    if (!p) {
      mySqlActiveCached = false;
      lastMySqlError = "Pool initialization returned null reference.";
      return false;
    }
    
    // Quick test query with a strict 2-second timeout to prevent stalling the server if MySQL port is blocked
    await Promise.race([
      p.query("SELECT 1"),
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error("MySQL connection test timed out (2s)")), 2000))
    ]);
    
    mySqlActiveCached = true;
    lastChecked = now;
    lastMySqlError = null;
    return true;
  } catch (err: any) {
    console.warn("[MySQL Check] Offline, using local JSON database fallback:", err.message || err);
    mySqlActiveCached = false;
    lastChecked = now;
    lastMySqlError = err.message || String(err);
    return false;
  }
}
