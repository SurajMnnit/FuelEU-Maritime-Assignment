-- Fuel EU Maritime Database Schema
-- Run this script to create all necessary tables

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
  id SERIAL PRIMARY KEY,
  route_id VARCHAR(50) NOT NULL UNIQUE,
  vessel_type VARCHAR(100) NOT NULL,
  fuel_type VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  ghg_intensity DECIMAL(10, 2) NOT NULL,
  fuel_consumption DECIMAL(15, 2) NOT NULL,
  distance DECIMAL(10, 2) NOT NULL,
  total_emissions DECIMAL(15, 2) NOT NULL,
  is_baseline BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ship Compliance table (stores computed CB per ship)
CREATE TABLE IF NOT EXISTS ship_compliance (
  id SERIAL PRIMARY KEY,
  ship_id VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  cb_gco2eq DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ship_id, year)
);

-- Bank Entries table (stores banked surplus per ship)
CREATE TABLE IF NOT EXISTS bank_entries (
  id SERIAL PRIMARY KEY,
  ship_id VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  amount_gco2eq DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pools table (pool metadata)
CREATE TABLE IF NOT EXISTS pools (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200),
  year INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pool Members table (each ship's CB before/after pooling)
CREATE TABLE IF NOT EXISTS pool_members (
  pool_id INTEGER NOT NULL,
  ship_id VARCHAR(50) NOT NULL,
  cb_before DECIMAL(15, 2) NOT NULL,
  cb_after DECIMAL(15, 2) NOT NULL,
  PRIMARY KEY (pool_id, ship_id),
  FOREIGN KEY (pool_id) REFERENCES pools(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_routes_year ON routes(year);
CREATE INDEX IF NOT EXISTS idx_routes_route_id ON routes(route_id);
CREATE INDEX IF NOT EXISTS idx_routes_is_baseline ON routes(is_baseline);
CREATE INDEX IF NOT EXISTS idx_ship_compliance_ship_year ON ship_compliance(ship_id, year);
CREATE INDEX IF NOT EXISTS idx_ship_compliance_year ON ship_compliance(year);
CREATE INDEX IF NOT EXISTS idx_bank_entries_ship_year ON bank_entries(ship_id, year);
CREATE INDEX IF NOT EXISTS idx_bank_entries_year ON bank_entries(year);
CREATE INDEX IF NOT EXISTS idx_pools_year ON pools(year);
CREATE INDEX IF NOT EXISTS idx_pool_members_pool_id ON pool_members(pool_id);

-- Seed initial route data (R001-R005)
INSERT INTO routes (route_id, vessel_type, fuel_type, year, ghg_intensity, fuel_consumption, distance, total_emissions, is_baseline)
VALUES 
  ('R001', 'Container Ship', 'HFO', 2024, 91.5, 5000000, 1200, 457500000, false),
  ('R002', 'Tanker', 'VLSFO', 2024, 88.2, 6000000, 1500, 529200000, false),
  ('R003', 'Bulk Carrier', 'MGO', 2024, 85.3, 4500000, 1000, 383850000, false),
  ('R004', 'Container Ship', 'LNG', 2024, 78.5, 5500000, 1300, 431750000, false),
  ('R005', 'Tanker', 'HFO', 2024, 92.8, 7000000, 1800, 649600000, false)
ON CONFLICT (route_id) DO NOTHING;
