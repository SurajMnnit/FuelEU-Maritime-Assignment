import { ComplianceBalance } from '../../core/domain/Compliance';
import { BankingRepository } from '../../core/ports/BankingRepository';
import pool from './database/connection';

export class PostgresBankingRepository implements BankingRepository {
  async getComplianceBalance(year: number): Promise<ComplianceBalance> {
    try {
      // Calculate total CB from ship_compliance table
      const result = await pool.query(
        `SELECT COALESCE(SUM(cb_gco2eq), 0) as total_cb
         FROM ship_compliance 
         WHERE year = $1`,
        [year]
      );
      
      const totalCb = parseFloat(result.rows[0].total_cb);
      
      return {
        year,
        cb: totalCb,
      };
    } catch (error) {
      console.error('Error fetching compliance balance:', error);
      return { year, cb: 0 };
    }
  }

  /**
   * Bank surplus for a specific ship
   */
  async bankSurplusForShip(shipId: string, year: number, amount: number): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get current ship CB
      const cbResult = await client.query(
        `SELECT cb_gco2eq FROM ship_compliance 
         WHERE ship_id = $1 AND year = $2 FOR UPDATE`,
        [shipId, year]
      );

      if (cbResult.rows.length === 0) {
        throw new Error(`No compliance balance found for ship ${shipId} in year ${year}`);
      }

      const currentCb = parseFloat(cbResult.rows[0].cb_gco2eq);

      if (currentCb < amount) {
        throw new Error(`Insufficient surplus. Current CB: ${currentCb}, Requested: ${amount}`);
      }

      // Deduct from ship CB
      await client.query(
        `UPDATE ship_compliance 
         SET cb_gco2eq = cb_gco2eq - $1, updated_at = CURRENT_TIMESTAMP 
         WHERE ship_id = $2 AND year = $3`,
        [amount, shipId, year]
      );

      // Add to bank_entries
      await client.query(
        `INSERT INTO bank_entries (ship_id, year, amount_gco2eq)
         VALUES ($1, $2, $3)`,
        [shipId, year, amount]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error banking surplus for ship:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get total banked amount for a ship in a year
   */
  async getBankedAmountForShip(shipId: string, year: number): Promise<number> {
    try {
      const result = await pool.query(
        `SELECT COALESCE(SUM(amount_gco2eq), 0) as total_banked
         FROM bank_entries 
         WHERE ship_id = $1 AND year = $2`,
        [shipId, year]
      );
      
      return parseFloat(result.rows[0].total_banked);
    } catch (error) {
      console.error('Error fetching banked amount:', error);
      return 0;
    }
  }

  /**
   * Apply banked surplus to a ship's CB
   */
  async applyBankedSurplusToShip(shipId: string, year: number, amount: number): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get total banked amount
      const bankedResult = await client.query(
        `SELECT COALESCE(SUM(amount_gco2eq), 0) as total_banked
         FROM bank_entries 
         WHERE ship_id = $1 AND year = $2`,
        [shipId, year]
      );

      const totalBanked = parseFloat(bankedResult.rows[0].total_banked);

      if (totalBanked < amount) {
        throw new Error(`Insufficient banked surplus. Available: ${totalBanked}, Requested: ${amount}`);
      }

      // Deduct from bank_entries (FIFO or proportional)
      // For simplicity, we'll deduct proportionally
      const entriesResult = await client.query(
        `SELECT id, amount_gco2eq 
         FROM bank_entries 
         WHERE ship_id = $1 AND year = $2 
         ORDER BY created_at ASC`,
        [shipId, year]
      );

      let remaining = amount;
      for (const entry of entriesResult.rows) {
        const entryAmount = parseFloat(entry.amount_gco2eq);
        if (remaining <= 0) break;

        if (entryAmount <= remaining) {
          // Delete entire entry
          await client.query(`DELETE FROM bank_entries WHERE id = $1`, [entry.id]);
          remaining -= entryAmount;
        } else {
          // Reduce entry amount
          await client.query(
            `UPDATE bank_entries 
             SET amount_gco2eq = amount_gco2eq - $1 
             WHERE id = $2`,
            [remaining, entry.id]
          );
          remaining = 0;
        }
      }

      // Add to ship CB
      await client.query(
        `UPDATE ship_compliance 
         SET cb_gco2eq = cb_gco2eq + $1, updated_at = CURRENT_TIMESTAMP 
         WHERE ship_id = $2 AND year = $3`,
        [amount, shipId, year]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error applying banked surplus:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Legacy methods for backward compatibility
  async bankSurplus(year: number, amount: number): Promise<void> {
    // This method is deprecated - use bankSurplusForShip instead
    throw new Error('Use bankSurplusForShip method with shipId parameter');
  }

  async getBankedAmount(year: number): Promise<number> {
    try {
      const result = await pool.query(
        `SELECT COALESCE(SUM(amount_gco2eq), 0) as total_banked
         FROM bank_entries 
         WHERE year = $1`,
        [year]
      );
      
      return parseFloat(result.rows[0].total_banked);
    } catch (error) {
      console.error('Error fetching banked amount:', error);
      return 0;
    }
  }

  async applyBankedSurplus(year: number, amount: number): Promise<void> {
    // This method is deprecated - use applyBankedSurplusToShip instead
    throw new Error('Use applyBankedSurplusToShip method with shipId parameter');
  }
}
