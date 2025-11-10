import { ComplianceBalance, AdjustedComplianceBalance } from '../../core/domain/Compliance';
import { ComplianceRepository } from '../../core/ports/ComplianceRepository';
import pool from './database/connection';

export class PostgresComplianceRepository implements ComplianceRepository {
  async findComplianceBalance(year: number): Promise<ComplianceBalance> {
    try {
      const result = await pool.query(
        `SELECT year, cb FROM compliance_balances WHERE year = $1`,
        [year]
      );
      
      if (result.rows.length === 0) {
        // Return default if not found
        return { year, cb: 0 };
      }
      
      return {
        year: result.rows[0].year,
        cb: parseFloat(result.rows[0].cb),
      };
    } catch (error) {
      console.error('Error fetching compliance balance:', error);
      // Return default on error
      return { year, cb: 0 };
    }
  }

  async findAdjustedComplianceBalance(year: number): Promise<AdjustedComplianceBalance[]> {
    try {
      const result = await pool.query(
        `SELECT 
          ship_id as "shipId",
          year,
          adjusted_cb as "adjustedCB"
        FROM adjusted_compliance_balances 
        WHERE year = $1
        ORDER BY ship_id`,
        [year]
      );
      
      return result.rows.map(row => ({
        shipId: row.shipId,
        year: row.year,
        adjustedCB: parseFloat(row.adjustedCB),
      }));
    } catch (error) {
      console.error('Error fetching adjusted compliance balance:', error);
      return [];
    }
  }
}

