import { Route, Baseline } from '../../core/domain/Route';
import { RouteRepository } from '../../core/ports/RouteRepository';
import pool from './database/connection';

export class PostgresRouteRepository implements RouteRepository {
  async findAll(): Promise<Route[]> {
    try {
      const result = await pool.query(`
        SELECT 
          route_id as "routeId",
          vessel_type as "vesselType",
          fuel_type as "fuelType",
          year,
          ghg_intensity as "ghgIntensity",
          fuel_consumption as "fuelConsumption",
          distance,
          total_emissions as "totalEmissions",
          COALESCE(is_baseline, false) as "isBaseline"
        FROM routes
        ORDER BY year DESC, route_id
      `);
      return result.rows;
    } catch (error) {
      console.error('Error fetching routes:', error);
      throw new Error('Failed to fetch routes from database');
    }
  }

  async findByRouteId(routeId: string): Promise<Route | null> {
    try {
      const result = await pool.query(
        `SELECT 
          route_id as "routeId",
          vessel_type as "vesselType",
          fuel_type as "fuelType",
          year,
          ghg_intensity as "ghgIntensity",
          fuel_consumption as "fuelConsumption",
          distance,
          total_emissions as "totalEmissions",
          COALESCE(is_baseline, false) as "isBaseline"
        FROM routes 
        WHERE route_id = $1`,
        [routeId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching route by ID:', error);
      throw new Error('Failed to fetch route from database');
    }
  }

  async saveBaseline(routeId: string, baseline: Baseline): Promise<Baseline> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // First, unset all existing baselines (only one baseline allowed)
      await client.query(
        `UPDATE routes SET is_baseline = false WHERE is_baseline = true`
      );

      // Now set the new route as baseline
      await client.query(
        `UPDATE routes SET is_baseline = true WHERE route_id = $1`,
        [routeId]
      );

      // Save baseline record (upsert)
      await client.query(
        `INSERT INTO baselines (route_id, year, ghg_intensity, fuel_consumption, distance, total_emissions)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (route_id, year) 
         DO UPDATE SET 
           ghg_intensity = EXCLUDED.ghg_intensity,
           fuel_consumption = EXCLUDED.fuel_consumption,
           distance = EXCLUDED.distance,
           total_emissions = EXCLUDED.total_emissions,
           created_at = CURRENT_TIMESTAMP`,
        [
          baseline.routeId,
          baseline.year,
          baseline.ghgIntensity,
          baseline.fuelConsumption,
          baseline.distance,
          baseline.totalEmissions,
        ]
      );

      await client.query('COMMIT');
      return baseline;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error saving baseline:', error);
      throw new Error('Failed to save baseline to database');
    } finally {
      client.release();
    }
  }

  async findBaseline(routeId: string, year: number): Promise<Baseline | null> {
    try {
      const result = await pool.query(
        `SELECT 
          route_id as "routeId",
          year,
          ghg_intensity as "ghgIntensity",
          fuel_consumption as "fuelConsumption",
          distance,
          total_emissions as "totalEmissions"
        FROM baselines 
        WHERE route_id = $1 AND year = $2`,
        [routeId, year]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching baseline:', error);
      throw new Error('Failed to fetch baseline from database');
    }
  }
}

