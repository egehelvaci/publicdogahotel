import { createPool } from '@vercel/postgres';

export const db = createPool({
  connectionString: process.env.POSTGRES_URL,
});

export async function executeQuery(query: string, params?: any[]) {
  try {
    const client = await db.connect();
    try {
      const result = await client.query(query, params);
      return result;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
} 