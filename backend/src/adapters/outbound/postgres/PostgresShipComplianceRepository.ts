import { ShipCompliance } from '../../core/domain/ShipCompliance';
import { ShipComplianceRepository } from '../../core/ports/ShipComplianceRepository';
import pool from './database/connection';

/**
 * Target GHG intensity for compliance (gCO₂e/MJ)
 */
const COMPLIANCE_TARGET = 89.3368;

export class PostgresShipComplianceRepository implements ShipComplianceRepository {
  async findByShipAndYear(shipId: string, year: number): Promise<ShipCompliance | null> {
    try {
      const result = await pool.query(
        `SELECT 
          id,
          ship_id as "shipId",
          year,
          cb_gco2eq as "cbGco2eq",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM ship_compliance 
        WHERE ship_id = $1 AND year = $2`,
        [shipId, year]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        shipId: row.shipId,
        year: row.year,
        cbGco2eq: parseFloat(row.cbGco2eq),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    } catch (error: any) {
      console.error('Error fetching ship compliance:', error);
      
      // Provide helpful error message if table doesn't exist
      if (error.code === '42P01' && error.message.includes('ship_compliance')) {
        throw new Error(
          `Database table 'ship_compliance' does not exist. Please run: npm run schema`
        );
      }
      
      throw new Error('Failed to fetch ship compliance from database');
    }
  }

  async findByYear(year: number): Promise<ShipCompliance[]> {
    try {
      const result = await pool.query(
        `SELECT 
          id,
          ship_id as "shipId",
          year,
          cb_gco2eq as "cbGco2eq",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM ship_compliance 
        WHERE year = $1
        ORDER BY ship_id`,
        [year]
      );

      return result.rows.map(row => ({
        id: row.id,
        shipId: row.shipId,
        year: row.year,
        cbGco2eq: parseFloat(row.cbGco2eq),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    } catch (error: any) {
      console.error('Error fetching ship compliance by year:', error);
      
      // Provide helpful error message if table doesn't exist
      if (error.code === '42P01' && error.message.includes('ship_compliance')) {
        throw new Error(
          `Database table 'ship_compliance' does not exist. Please run: npm run schema`
        );
      }
      
      throw new Error('Failed to fetch ship compliance from database');
    }
  }

  async save(shipCompliance: ShipCompliance): Promise<ShipCompliance> {
    try {
      if (shipCompliance.id) {
        // Update existing
        const result = await pool.query(
          `UPDATE ship_compliance 
          SET cb_gco2eq = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING 
            id,
            ship_id as "shipId",
            year,
            cb_gco2eq as "cbGco2eq",
            created_at as "createdAt",
            updated_at as "updatedAt"`,
          [shipCompliance.cbGco2eq, shipCompliance.id]
        );

        return {
          id: result.rows[0].id,
          shipId: result.rows[0].shipId,
          year: result.rows[0].year,
          cbGco2eq: parseFloat(result.rows[0].cbGco2eq),
          createdAt: result.rows[0].createdAt,
          updatedAt: result.rows[0].updatedAt,
        };
      } else {
        // Insert new
        const result = await pool.query(
          `INSERT INTO ship_compliance (ship_id, year, cb_gco2eq)
          VALUES ($1, $2, $3)
          ON CONFLICT (ship_id, year) 
          DO UPDATE SET cb_gco2eq = EXCLUDED.cb_gco2eq, updated_at = CURRENT_TIMESTAMP
          RETURNING 
            id,
            ship_id as "shipId",
            year,
            cb_gco2eq as "cbGco2eq",
            created_at as "createdAt",
            updated_at as "updatedAt"`,
          [shipCompliance.shipId, shipCompliance.year, shipCompliance.cbGco2eq]
        );

        return {
          id: result.rows[0].id,
          shipId: result.rows[0].shipId,
          year: result.rows[0].year,
          cbGco2eq: parseFloat(result.rows[0].cbGco2eq),
          createdAt: result.rows[0].createdAt,
          updatedAt: result.rows[0].updatedAt,
        };
      }
    } catch (error: any) {
      console.error('Error saving ship compliance:', error);
      
      // Provide helpful error message if table doesn't exist
      if (error.code === '42P01' && error.message.includes('ship_compliance')) {
        throw new Error(
          `Database table 'ship_compliance' does not exist. Please run: npm run schema`
        );
      }
      
      throw new Error('Failed to save ship compliance to database');
    }
  }

  async computeAndSave(shipId: string, year: number, routeId: string): Promise<ShipCompliance> {
    try {
      // First, try to get route data for the specific year
      let routeResult = await pool.query(
        `SELECT 
          ghg_intensity as "ghgIntensity",
          fuel_consumption as "fuelConsumption",
          year
        FROM routes 
        WHERE route_id = $1 AND year = $2`,
        [routeId, year]
      );

      // If not found for that year, try to find the route for any year
      if (routeResult.rows.length === 0) {
        console.log(`⚠️  Route ${routeId} not found for year ${year}, searching for any year...`);
        routeResult = await pool.query(
          `SELECT 
            ghg_intensity as "ghgIntensity",
            fuel_consumption as "fuelConsumption",
            year
          FROM routes 
          WHERE route_id = $1
          ORDER BY year DESC
          LIMIT 1`,
          [routeId]
        );

        if (routeResult.rows.length === 0) {
          // Check if route exists at all
          const routeExists = await pool.query(
            `SELECT route_id, year FROM routes WHERE route_id = $1 LIMIT 1`,
            [routeId]
          );
          
          if (routeExists.rows.length === 0) {
            throw new Error(
              `Route ${routeId} does not exist. Available routes: R001, R002, R003, R004, R005`
            );
          } else {
            const availableYears = await pool.query(
              `SELECT DISTINCT year FROM routes WHERE route_id = $1 ORDER BY year`,
              [routeId]
            );
            const years = availableYears.rows.map(r => r.year).join(', ');
            throw new Error(
              `Route ${routeId} not found for year ${year}. Available years for this route: ${years}`
            );
          }
        } else {
          const foundYear = routeResult.rows[0].year;
          console.log(`ℹ️  Using route ${routeId} data from year ${foundYear} (requested year: ${year})`);
        }
      }

      const route = routeResult.rows[0];
      const ghgIntensity = parseFloat(route.ghgIntensity);
      const fuelConsumption = parseFloat(route.fuelConsumption);

      // Compute CB: (Target - Actual) * Fuel Consumption
      // Positive CB = surplus (compliant), Negative CB = deficit (non-compliant)
      const cb = (COMPLIANCE_TARGET - ghgIntensity) * fuelConsumption;

      // Save the computed CB
      const shipCompliance: ShipCompliance = {
        shipId,
        year,
        cbGco2eq: cb,
      };

      return await this.save(shipCompliance);
    } catch (error: any) {
      console.error('Error computing ship compliance:', error);
      
      // Provide helpful error message if table doesn't exist
      if (error.code === '42P01' && error.message.includes('ship_compliance')) {
        throw new Error(
          `Database table 'ship_compliance' does not exist. Please run the schema: npm run schema`
        );
      }
      
      throw new Error(`Failed to compute compliance balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

