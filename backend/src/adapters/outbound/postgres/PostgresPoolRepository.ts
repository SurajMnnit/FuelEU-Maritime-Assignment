import { Pool } from '../../core/domain/Pool';
import { PoolRepository } from '../../core/ports/PoolRepository';
import pool from './database/connection';

export class PostgresPoolRepository implements PoolRepository {
  async save(poolData: Pool): Promise<Pool> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert pool (using auto-generated id)
      const poolResult = await client.query(
        `INSERT INTO pools (name, year, created_at)
         VALUES ($1, $2, $3)
         RETURNING id, name, year, created_at`,
        [
          poolData.name || null,
          poolData.year,
          poolData.createdAt || new Date(),
        ]
      );

      const poolId = poolResult.rows[0].id;

      // Insert pool members
      for (const member of poolData.members) {
        await client.query(
          `INSERT INTO pool_members (pool_id, ship_id, cb_before, cb_after)
           VALUES ($1, $2, $3, $4)`,
          [
            poolId,
            member.shipId,
            member.cbBefore,
            member.cbAfter,
          ]
        );
      }

      await client.query('COMMIT');

      // Return updated pool with id
      return {
        ...poolData,
        poolId: poolId.toString(),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error saving pool:', error);
      throw new Error('Failed to save pool to database');
    } finally {
      client.release();
    }
  }

  async findAll(): Promise<Pool[]> {
    try {
      const poolsResult = await pool.query(
        `SELECT 
          id,
          name,
          year,
          created_at as "createdAt"
        FROM pools
        ORDER BY created_at DESC`
      );

      const pools: Pool[] = [];

      for (const poolRow of poolsResult.rows) {
        const membersResult = await pool.query(
          `SELECT 
            ship_id as "shipId",
            cb_before as "cbBefore",
            cb_after as "cbAfter"
          FROM pool_members
          WHERE pool_id = $1`,
          [poolRow.id]
        );

        // Calculate pool sum
        const poolSum = membersResult.rows.reduce((sum, m) => sum + parseFloat(m.cbAfter), 0);

        pools.push({
          poolId: poolRow.id.toString(),
          name: poolRow.name || undefined,
          year: poolRow.year,
          members: membersResult.rows.map(m => ({
            shipId: m.shipId,
            adjustedCB: parseFloat(m.cbBefore),
            cbBefore: parseFloat(m.cbBefore),
            cbAfter: parseFloat(m.cbAfter),
          })),
          poolSum,
          createdAt: poolRow.createdAt,
        });
      }

      return pools;
    } catch (error: any) {
      console.error('Error fetching pools:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Provide helpful error message if table/column doesn't exist
      if (error.code === '42703') {
        throw new Error(
          `Database column error: ${error.message}. Please run: npm run schema`
        );
      }
      
      if (error.code === '42P01') {
        throw new Error(
          `Database table 'pools' or 'pool_members' does not exist. Please run: npm run schema`
        );
      }
      
      throw new Error(`Failed to fetch pools from database: ${error.message || 'Unknown error'}`);
    }
  }

  async findById(poolId: string): Promise<Pool | null> {
    try {
      const poolResult = await pool.query(
        `SELECT 
          id,
          name,
          year,
          created_at as "createdAt"
        FROM pools
        WHERE id = $1`,
        [parseInt(poolId)]
      );

      if (poolResult.rows.length === 0) {
        return null;
      }

      const poolRow = poolResult.rows[0];

      const membersResult = await pool.query(
        `SELECT 
          ship_id as "shipId",
          cb_before as "cbBefore",
          cb_after as "cbAfter"
        FROM pool_members
        WHERE pool_id = $1`,
        [poolRow.id]
      );

      const poolSum = membersResult.rows.reduce((sum, m) => sum + parseFloat(m.cbAfter), 0);

      return {
        poolId: poolRow.id.toString(),
        name: poolRow.name || undefined,
        year: poolRow.year,
        members: membersResult.rows.map(m => ({
          shipId: m.shipId,
          adjustedCB: parseFloat(m.cbBefore),
          cbBefore: parseFloat(m.cbBefore),
          cbAfter: parseFloat(m.cbAfter),
        })),
        poolSum,
        createdAt: poolRow.createdAt,
      };
    } catch (error) {
      console.error('Error fetching pool by ID:', error);
      return null;
    }
  }
}
