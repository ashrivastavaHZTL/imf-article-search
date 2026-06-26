import sql, { config as SqlConfig, ConnectionPool } from "mssql";

const poolCache: Record<string, ConnectionPool> = {};

const dbConfigs: Record<string, SqlConfig> = {
  article_db: {
    user: process.env.ARTICLE_DB_USER as string,
    password: process.env.ARTICLE_DB_PASSWORD as string,
    server: process.env.ARTICLE_DB_SERVER as string,
    database: process.env.ARTICLE_DB_NAME as string,
    options: {
      encrypt: true, // required for Azure SQL
      enableArithAbort: true,
    },
  },
};

export async function getDatabaseConnection(
  dbName: string,
): Promise<ConnectionPool> {
  if (poolCache[dbName]) {
    if (process.env.NODE_ENV === "development")
      console.log(`[db] Reusing connection: ${dbName}`);

    return poolCache[dbName];
  }

  const config = dbConfigs[dbName];
  if (!config)
    throw new Error(`Database configuration not found for: ${dbName}`);

  try {
    const pool = await new sql.ConnectionPool(config).connect();

    if (process.env.NODE_ENV === "development")
      console.log(`[db] New connection: ${dbName}`);

    poolCache[dbName] = pool;
    return pool;
  } catch (error) {
    console.error(`[db] Connection failed for: ${dbName}`, error);
    throw error;
  }
}
