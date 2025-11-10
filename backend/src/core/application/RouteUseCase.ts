/**
 * Route Use Case
 * 
 * This class contains the business logic for route management operations,
 * including route retrieval, baseline management, and route comparison.
 * It implements the application layer of the hexagonal architecture.
 * 
 * @class RouteUseCase
 * @module application/RouteUseCase
 */

import { Route, Baseline, ComparisonData } from '../domain/Route';
import { RouteRepository } from '../ports/RouteRepository';

/**
 * Compliance target for GHG intensity as per Fuel EU Maritime regulation
 * Units: gCO₂e/MJ (grams of CO₂ equivalent per megajoule)
 * @constant {number} COMPLIANCE_TARGET
 */
const COMPLIANCE_TARGET = 89.3368; // gCO₂e/MJ

/**
 * Route Use Case Class
 * 
 * Handles all business logic related to route operations, including:
 * - Route retrieval and management
 * - Baseline route setting and retrieval
 * - Route comparison with baseline data
 * - Compliance checking against regulatory targets
 */
export class RouteUseCase {
  /**
   * Creates an instance of RouteUseCase
   * 
   * @param {RouteRepository} routeRepository - Repository for route data access
   */
  constructor(private routeRepository: RouteRepository) {}

  /**
   * Retrieves all routes from the repository
   * 
   * @returns {Promise<Route[]>} Array of all routes
   * @throws {Error} If route retrieval fails
   */
  async getAllRoutes(): Promise<Route[]> {
    return this.routeRepository.findAll();
  }

  /**
   * Sets a route as the baseline for comparison purposes
   * 
   * The baseline route serves as a reference point for comparing
   * other routes' emissions and performance metrics.
   * 
   * @param {string} routeId - The unique identifier of the route
   * @param {Baseline} baseline - Baseline data to save
   * @returns {Promise<Baseline>} The saved baseline data
   * @throws {Error} If baseline saving fails
   */
  async setBaseline(routeId: string, baseline: Baseline): Promise<Baseline> {
    return this.routeRepository.saveBaseline(routeId, baseline);
  }

  /**
   * Gets comparison data for a specific route against its baseline
   * 
   * This method retrieves the baseline data for a route and compares it
   * with the current route data. It calculates the percent difference
   * in GHG intensity and checks compliance against the regulatory target.
   * 
   * The method attempts to find the baseline in the following order:
   * 1. Baseline table for the requested year
   * 2. Baseline table for the route's own year
   * 3. Route data if the route is marked as baseline
   * 
   * @param {string} routeId - The unique identifier of the route to compare
   * @param {number} year - The year for which to retrieve the baseline
   * @returns {Promise<ComparisonData>} Comparison data including baseline, current route, percent difference, and compliance status
   * @throws {Error} If route not found or baseline not found
   */
  async getComparison(routeId: string, year: number): Promise<ComparisonData> {
    // Retrieve the route to compare (this will be used as the "current" data)
    const route = await this.routeRepository.findByRouteId(routeId);
    if (!route) {
      throw new Error(`Route ${routeId} not found`);
    }

    // Attempt to find baseline data in the following priority order:
    // 1. Baseline table for the requested year
    let baseline = await this.routeRepository.findBaseline(routeId, year);
    
    // 2. If not found, try the route's own year
    if (!baseline) {
      baseline = await this.routeRepository.findBaseline(routeId, route.year);
    }
    
    // 3. If still not found but route is marked as baseline, use route data
    if (!baseline && route.isBaseline) {
      baseline = {
        routeId: route.routeId,
        year: route.year,
        ghgIntensity: route.ghgIntensity,
        fuelConsumption: route.fuelConsumption,
        distance: route.distance,
        totalEmissions: route.totalEmissions,
      };
    }

    // If no baseline found after all attempts, throw error
    if (!baseline) {
      throw new Error(`Baseline not found for route ${routeId}. Please set this route as baseline first.`);
    }

    // Use the route as the comparison (current) data
    // If the route is the baseline itself, comparison will show no change
    const comparison = route;

    // Calculate percent difference: ((current / baseline) - 1) * 100
    // Positive values indicate increase, negative values indicate decrease
    const percentDifference = ((comparison.ghgIntensity / baseline.ghgIntensity) - 1) * 100;
    
    // Check compliance: route is compliant if GHG intensity <= regulatory target
    const isCompliant = comparison.ghgIntensity <= COMPLIANCE_TARGET;

    return {
      baseline,
      comparison,
      percentDifference,
      complianceTarget: COMPLIANCE_TARGET,
      isCompliant,
    };
  }

  /**
   * Gets comparison data for all routes against the baseline
   * 
   * This method retrieves all routes (optionally filtered by year) and
   * compares each one against the baseline route. It returns an array
   * of comparison data for all routes.
   * 
   * The baseline is determined by finding the route marked as baseline,
   * then attempting to retrieve baseline data from the baseline table.
   * If no baseline table entry exists, the baseline route's own data is used.
   * 
   * @param {number} [year] - Optional year filter to compare only routes from that year
   * @returns {Promise<ComparisonData[]>} Array of comparison data for all routes
   * @throws {Error} If no baseline route is found
   */
  async getAllComparisons(year?: number): Promise<ComparisonData[]> {
    // Retrieve all routes from the repository
    const allRoutes = await this.routeRepository.findAll();
    
    // Find the route marked as baseline (there should be exactly one)
    const baselineRoute = allRoutes.find(r => r.isBaseline);
    
    if (!baselineRoute) {
      throw new Error('No baseline route found. Please set a baseline route first.');
    }

    // Attempt to retrieve baseline data from baseline table
    let baseline: Baseline | null = null;
    
    // Try to find baseline in baselines table for the specified year
    if (year) {
      baseline = await this.routeRepository.findBaseline(baselineRoute.routeId, year);
    }
    
    // If not found, try to find baseline for the route's own year
    if (!baseline) {
      baseline = await this.routeRepository.findBaseline(baselineRoute.routeId, baselineRoute.year);
    }
    
    // If baseline not found in baselines table, use the baseline route's data
    if (!baseline) {
      baseline = {
        routeId: baselineRoute.routeId,
        year: baselineRoute.year,
        ghgIntensity: baselineRoute.ghgIntensity,
        fuelConsumption: baselineRoute.fuelConsumption,
        distance: baselineRoute.distance,
        totalEmissions: baselineRoute.totalEmissions,
      };
    }

    // Filter routes by year if specified, otherwise use all routes
    const routesToCompare = year 
      ? allRoutes.filter(r => r.year === year)
      : allRoutes;

    // Compare each route with the baseline
    // Calculate percent difference and compliance status for each route
    const comparisons: ComparisonData[] = routesToCompare.map(route => {
      // Calculate percent difference in GHG intensity
      const percentDifference = ((route.ghgIntensity / baseline.ghgIntensity) - 1) * 100;
      
      // Check compliance against regulatory target
      const isCompliant = route.ghgIntensity <= COMPLIANCE_TARGET;

      return {
        baseline,
        comparison: route,
        percentDifference,
        complianceTarget: COMPLIANCE_TARGET,
        isCompliant,
      };
    });

    return comparisons;
  }
}

