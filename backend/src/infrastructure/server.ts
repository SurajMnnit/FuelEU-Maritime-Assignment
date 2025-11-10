/**
 * FuelEU Maritime Backend Server
 * 
 * Express server setup with clean architecture structure:
 * - Routes are defined in adapters/inbound/http/routes/
 * - Repositories are implemented in adapters/outbound/postgres/
 * - Core business logic is in core/application/
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routeRoutes from '../adapters/inbound/http/routes/routeRoutes';
import complianceRoutes from '../adapters/inbound/http/routes/complianceRoutes';
import bankingRoutes from '../adapters/inbound/http/routes/bankingRoutes';
import poolRoutes from '../adapters/inbound/http/routes/poolRoutes';
import shipComplianceRoutes from '../adapters/inbound/http/routes/shipComplianceRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', routeRoutes);
app.use('/api', complianceRoutes);
app.use('/api', bankingRoutes);
app.use('/api', poolRoutes);
app.use('/api', shipComplianceRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💾 Database: PostgreSQL`);
});

