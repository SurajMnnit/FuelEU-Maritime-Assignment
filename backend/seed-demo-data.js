/**
 * Seed demo data for project demonstration
 * Generates 100 rows of ship compliance data with realistic values
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'fuel_eu_maritime',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// Target GHG intensity for compliance (gCO₂e/MJ)
const COMPLIANCE_TARGET = 89.3368;

// Sample route data for generating realistic CB values
const routeData = [
  { routeId: 'R001', ghgIntensity: 91.5, fuelConsumption: 5000000 },
  { routeId: 'R002', ghgIntensity: 88.2, fuelConsumption: 6000000 },
  { routeId: 'R003', ghgIntensity: 85.3, fuelConsumption: 4500000 },
  { routeId: 'R004', ghgIntensity: 78.5, fuelConsumption: 5500000 },
  { routeId: 'R005', ghgIntensity: 92.8, fuelConsumption: 7000000 },
];

// Generate random ship IDs
function generateShipId(index) {
  const prefixes = ['SHIP', 'VESSEL', 'MV', 'MS', 'SS'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = String(index + 1).padStart(4, '0');
  return `${prefix}-${number}`;
}

// Generate realistic CB value based on route data
function generateCB(route) {
  // Add some variation (±5% to make it realistic)
  const variation = 1 + (Math.random() - 0.5) * 0.1; // ±5%
  const adjustedIntensity = route.ghgIntensity * variation;
  const cb = (COMPLIANCE_TARGET - adjustedIntensity) * route.fuelConsumption;
  return Math.round(cb * 100) / 100; // Round to 2 decimal places
}

async function seedDemoData() {
  console.log('🌱 Seeding demo data...');
  console.log('');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    await client.query('DELETE FROM pool_members');
    await client.query('DELETE FROM pools');
    await client.query('DELETE FROM bank_entries');
    await client.query('DELETE FROM ship_compliance');
    // Don't delete routes - keep existing ones and add more
    console.log('✅ Cleared existing data');
    console.log('');
    
    // Generate additional routes (keep existing 5, add 95 more)
    console.log('🛣️  Generating routes data...');
    const vesselTypes = ['Container Ship', 'Tanker', 'Bulk Carrier', 'Ro-Ro', 'Cruise Ship', 'Cargo Ship', 'LNG Carrier', 'Chemical Tanker'];
    const fuelTypes = ['HFO', 'VLSFO', 'MGO', 'LNG', 'Methanol', 'Ammonia', 'Hydrogen', 'Battery'];
    const routeYears = [2023, 2024, 2025];
    
    // Check existing routes
    const existingRoutes = await client.query('SELECT route_id FROM routes');
    const existingRouteIds = new Set(existingRoutes.rows.map(r => r.route_id));
    
    let routesCreated = 0;
    const routesToCreate = 100 - existingRouteIds.size; // Create 100 total routes
    
    for (let i = 0; i < routesToCreate; i++) {
      // Generate unique route ID
      let routeId;
      let attempts = 0;
      do {
        const num = String(existingRouteIds.size + i + 1).padStart(4, '0');
        routeId = `R${num}`;
        attempts++;
      } while (existingRouteIds.has(routeId) && attempts < 1000);
      
      existingRouteIds.add(routeId);
      
      const vesselType = vesselTypes[Math.floor(Math.random() * vesselTypes.length)];
      const fuelType = fuelTypes[Math.floor(Math.random() * fuelTypes.length)];
      const year = routeYears[Math.floor(Math.random() * routeYears.length)];
      
      // Generate realistic GHG intensity based on fuel type
      const baseIntensity = {
        'HFO': 92.0,
        'VLSFO': 88.0,
        'MGO': 85.0,
        'LNG': 78.0,
        'Methanol': 75.0,
        'Ammonia': 0.0, // Zero carbon
        'Hydrogen': 0.0, // Zero carbon
        'Battery': 0.0  // Zero carbon (if renewable)
      }[fuelType] || 88.0;
      
      // Add variation (±10%)
      const variation = 1 + (Math.random() - 0.5) * 0.2;
      const ghgIntensity = Math.round(baseIntensity * variation * 100) / 100;
      
      // Generate realistic fuel consumption (MJ)
      const fuelConsumption = Math.round((3000000 + Math.random() * 7000000) * 100) / 100;
      
      // Generate distance (nautical miles)
      const distance = Math.round((500 + Math.random() * 2000) * 100) / 100;
      
      // Calculate total emissions
      const totalEmissions = Math.round(ghgIntensity * fuelConsumption * 100) / 100;
      
      // Set first route of 2024 as baseline
      const isBaseline = i === 0 && year === 2024 && !existingRoutes.rows.some(r => r.route_id.startsWith('R') && existingRouteIds.size === 5);
      
      await client.query(
        `INSERT INTO routes (route_id, vessel_type, fuel_type, year, ghg_intensity, fuel_consumption, distance, total_emissions, is_baseline)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (route_id) DO NOTHING`,
        [routeId, vesselType, fuelType, year, ghgIntensity, fuelConsumption, distance, totalEmissions, isBaseline]
      );
      
      routesCreated++;
      if (routesCreated % 20 === 0) {
        process.stdout.write(`   Created ${routesCreated}/${routesToCreate} routes...\r`);
      }
    }
    console.log(`   ✅ Created ${routesCreated} additional routes (Total: ${existingRouteIds.size} routes)`);
    console.log('');
    
    // Generate 100 ships with compliance data
    console.log('📊 Generating 100 ships with compliance data...');
    const ships = [];
    const years = [2023, 2024, 2025];
    
    for (let i = 0; i < 100; i++) {
      const shipId = generateShipId(i);
      const year = years[Math.floor(Math.random() * years.length)];
      const route = routeData[Math.floor(Math.random() * routeData.length)];
      const cb = generateCB(route);
      
      ships.push({ shipId, year, cb, routeId: route.routeId });
    }
    
    // Insert ship compliance data
    let inserted = 0;
    for (const ship of ships) {
      await client.query(
        `INSERT INTO ship_compliance (ship_id, year, cb_gco2eq)
         VALUES ($1, $2, $3)
         ON CONFLICT (ship_id, year) DO UPDATE SET cb_gco2eq = EXCLUDED.cb_gco2eq`,
        [ship.shipId, ship.year, ship.cb]
      );
      
      // Also populate adjusted_compliance_balances (adjusted CB = base CB for now)
      // Adjusted CB will be updated when banking operations occur
      await client.query(
        `INSERT INTO adjusted_compliance_balances (ship_id, year, adjusted_cb)
         VALUES ($1, $2, $3)
         ON CONFLICT (ship_id, year) DO UPDATE SET 
           adjusted_cb = EXCLUDED.adjusted_cb`,
        [ship.shipId, ship.year, ship.cb]
      );
      
      inserted++;
      if (inserted % 20 === 0) {
        process.stdout.write(`   Inserted ${inserted}/100 ships...\r`);
      }
    }
    console.log(`   ✅ Inserted ${inserted} ships`);
    console.log('');
    
    // Generate some banked amounts (for ships with surplus)
    console.log('💰 Generating banked surplus data...');
    const surplusShips = ships.filter(s => s.cb > 0);
    const shipsToBank = surplusShips.slice(0, Math.min(30, surplusShips.length));
    
    let banked = 0;
    for (const ship of shipsToBank) {
      const bankAmount = Math.round(ship.cb * (0.3 + Math.random() * 0.4)); // Bank 30-70% of surplus
      if (bankAmount > 0) {
        await client.query(
          `INSERT INTO bank_entries (ship_id, year, amount_gco2eq)
           VALUES ($1, $2, $3)`,
          [ship.shipId, ship.year, bankAmount]
        );
        banked++;
      }
    }
    console.log(`   ✅ Created ${banked} bank entries`);
    console.log('');
    
    // Generate some pools
    console.log('👥 Generating pool data...');
    const poolsToCreate = 5;
    const shipsByYear = {};
    ships.forEach(s => {
      if (!shipsByYear[s.year]) shipsByYear[s.year] = [];
      shipsByYear[s.year].push(s);
    });
    
    let poolsCreated = 0;
    for (let i = 0; i < poolsToCreate; i++) {
      const year = years[Math.floor(Math.random() * years.length)];
      const availableShips = shipsByYear[year] || [];
      
      if (availableShips.length >= 2) {
        // Select 2-5 random ships for this pool
        const numShips = 2 + Math.floor(Math.random() * 4);
        const selectedShips = availableShips
          .sort(() => Math.random() - 0.5)
          .slice(0, numShips);
        
        // Calculate pool sum
        const poolSum = selectedShips.reduce((sum, s) => sum + s.cb, 0);
        
        if (poolSum >= 0) {
          // Create pool
          const poolResult = await client.query(
            `INSERT INTO pools (year, created_at)
             VALUES ($1, CURRENT_TIMESTAMP)
             RETURNING id`,
            [year]
          );
          
          const poolId = poolResult.rows[0].id;
          const cbAfter = poolSum / selectedShips.length;
          
          // Insert pool members
          for (const ship of selectedShips) {
            await client.query(
              `INSERT INTO pool_members (pool_id, ship_id, cb_before, cb_after)
               VALUES ($1, $2, $3, $4)`,
              [poolId, ship.shipId, ship.cb, cbAfter]
            );
          }
          
          poolsCreated++;
        }
      }
    }
    console.log(`   ✅ Created ${poolsCreated} pools`);
    console.log('');
    
    await client.query('COMMIT');
    
    // Print summary
    console.log('📈 Data Summary:');
    console.log('');
    
    // Routes summary
    const routesSummary = await client.query(`
      SELECT 
        year,
        COUNT(*) as route_count,
        COUNT(CASE WHEN is_baseline THEN 1 END) as baseline_count
      FROM routes
      GROUP BY year
      ORDER BY year
    `);
    
    const totalRoutes = await client.query('SELECT COUNT(*) as count FROM routes');
    console.log(`Routes: ${totalRoutes.rows[0].count} total routes`);
    routesSummary.rows.forEach(row => {
      console.log(`   ${row.year}: ${row.route_count} routes (${row.baseline_count} baseline)`);
    });
    console.log('');
    
    // Ship compliance summary
    const summaryResult = await client.query(`
      SELECT 
        year,
        COUNT(*) as ship_count,
        SUM(CASE WHEN cb_gco2eq > 0 THEN 1 ELSE 0 END) as surplus_count,
        SUM(CASE WHEN cb_gco2eq < 0 THEN 1 ELSE 0 END) as deficit_count,
        SUM(cb_gco2eq) as total_cb
      FROM ship_compliance
      GROUP BY year
      ORDER BY year
    `);
    
    console.log('Ship Compliance by Year:');
    summaryResult.rows.forEach(row => {
      console.log(`   ${row.year}: ${row.ship_count} ships (${row.surplus_count} surplus, ${row.deficit_count} deficit, Total CB: ${parseFloat(row.total_cb).toLocaleString()} gCO₂e)`);
    });
    console.log('');
    
    const bankSummary = await client.query(`
      SELECT COUNT(*) as count, SUM(amount_gco2eq) as total
      FROM bank_entries
    `);
    console.log(`Banked Surplus: ${bankSummary.rows[0].count} entries, Total: ${parseFloat(bankSummary.rows[0].total || 0).toLocaleString()} gCO₂e`);
    console.log('');
    
    const poolSummary = await client.query(`
      SELECT COUNT(DISTINCT pool_id) as pool_count, COUNT(*) as member_count
      FROM pool_members
    `);
    console.log(`Pools: ${poolSummary.rows[0].pool_count} pools, ${poolSummary.rows[0].member_count} total members`);
    console.log('');
    
    // Show available ships for pool creation
    const availableShips2024 = await client.query(`
      SELECT COUNT(*) as count 
      FROM adjusted_compliance_balances 
      WHERE year = 2024
    `);
    console.log(`Available ships for pool creation (2024): ${availableShips2024.rows[0].count} ships`);
    console.log('');
    
    console.log('🎉 Demo data seeded successfully!');
    console.log('');
    console.log('You can now:');
    console.log('  - View routes in the Routes page');
    console.log('  - Compare routes in the Compare page');
    console.log('  - View ships in the Ship Compliance page');
    console.log('  - Create pools in the Pooling page (use ships from the dropdown)');
    console.log('  - Bank surplus in the Banking page');
    console.log('  - Test all APIs with realistic data');
    console.log('');
    console.log('💡 Tip: When creating pools, select ships from the dropdown list.');
    console.log('   Only ships with adjusted CB data for the selected year are available.');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('');
    console.error('❌ Error seeding data:', error.message);
    console.error('Error code:', error.code);
    if (error.code === '28P01') {
      console.error('');
      console.error('💡 Password authentication failed. Check your .env file.');
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDemoData().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

