# Varuna Marine Services - Fuel EU Maritime Compliance Management System

<div align="center">

![Varuna Marine Services](frontend/public/varuna-logo.svg)

**Smart Sustainable Shipping**

A comprehensive full-stack application for managing Fuel EU Maritime compliance, featuring a modern UI with sidebar navigation, route management, compliance tracking, banking operations, and Article 21 pooling functionality.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-336791.svg)](https://www.postgresql.org/)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Frontend Features](#frontend-features)
- [Development](#development)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

The **Fuel EU Maritime Compliance Management System** is a comprehensive solution designed to help maritime operators comply with the European Union's Fuel EU Maritime Regulation. The system enables:

- **Route Management**: Track vessel routes, emissions, and GHG intensity
- **Compliance Tracking**: Monitor compliance balances (CB) per ship and fleet-wide
- **Banking Operations**: Bank surplus compliance for future use and apply to deficits
- **Article 21 Pooling**: Create compliance pools to collectively meet regulatory requirements

The application follows **Hexagonal Architecture** (Ports & Adapters) principles, ensuring clean separation of concerns, testability, and maintainability.

---

## ✨ Features

### 1. **Routes Management**
- View all vessel routes with comprehensive filtering
- Filter by vessel type, fuel type, and year
- Set baseline routes for comparison
- Track GHG intensity, fuel consumption, distance, and total emissions
- Visualize route data in interactive tables

### 2. **Compliance Comparison**
- Compare current routes against baseline data
- Calculate percent differences for key metrics
- Visualize GHG intensity with bar charts
- Check compliance status against regulatory targets (89.3368 gCO₂e/MJ)
- View compliance status badges (Compliant, Non-Compliant, Warning)

### 3. **Ship Compliance Balance (CB)**
- Compute compliance balance for individual ships
- View all ship compliance data for a given year
- Search for specific ships
- Display CB values with proper formatting
- Track compliance status per vessel

### 4. **Banking Operations**
- Bank surplus compliance balance for future use
- Apply banked surplus to cover deficits
- Per-ship banking operations
- Real-time CB updates after banking operations
- View banked amounts per ship and year

### 5. **Article 21 Pooling**
- **Strategic Pooling**: Create pools with selected ships
- **Fleet Compliance Management**: Manage fleet-wide compliance
- View adjusted compliance balances per ship
- Validate pool creation against Article 21 rules:
  - Sum of adjusted CBs must be ≥ 0
  - Deficit ships cannot exit worse than they entered
  - Surplus ships cannot exit negative
- Visual before/after CB display for pool members
- Pool history with detailed member information
- Real-time validation and warnings

---

## 🏗️ Architecture

This project follows **Hexagonal Architecture** (also known as Ports & Adapters or Clean Architecture), which provides:

- **Separation of Concerns**: Business logic is independent of infrastructure
- **Testability**: Core logic can be tested without external dependencies
- **Flexibility**: Easy to swap implementations (e.g., different databases)
- **Maintainability**: Clear boundaries between layers

### Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  (React Components, HTTP Routes, UI Adapters)           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  Application Layer                       │
│  (Use Cases, Business Workflows, Orchestration)         │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                    Domain Layer                          │
│  (Domain Models, Business Rules, Entities)              │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Infrastructure Layer                        │
│  (PostgreSQL, HTTP Clients, External Services)          │
└─────────────────────────────────────────────────────────┘
```

### Backend Structure

```
backend/
├── src/
│   ├── core/                          # Core Business Logic
│   │   ├── domain/                    # Domain Models & Entities
│   │   │   ├── Route.ts
│   │   │   ├── ShipCompliance.ts
│   │   │   ├── Compliance.ts
│   │   │   ├── Banking.ts
│   │   │   └── Pool.ts
│   │   ├── application/               # Use Cases (Business Logic)
│   │   │   ├── RouteUseCase.ts
│   │   │   ├── ShipComplianceUseCase.ts
│   │   │   ├── ComplianceUseCase.ts
│   │   │   ├── BankingUseCase.ts
│   │   │   └── PoolUseCase.ts
│   │   └── ports/                     # Repository Interfaces
│   │       ├── RouteRepository.ts
│   │       ├── ShipComplianceRepository.ts
│   │       ├── ComplianceRepository.ts
│   │       ├── BankingRepository.ts
│   │       └── PoolRepository.ts
│   ├── adapters/
│   │   ├── inbound/                   # Incoming Adapters
│   │   │   └── http/
│   │   │       └── routes/            # Express Route Handlers
│   │   │           ├── routeRoutes.ts
│   │   │           ├── shipComplianceRoutes.ts
│   │   │           ├── complianceRoutes.ts
│   │   │           ├── bankingRoutes.ts
│   │   │           └── poolRoutes.ts
│   │   └── outbound/                  # Outgoing Adapters
│   │       └── postgres/              # PostgreSQL Repositories
│   │           ├── PostgresRouteRepository.ts
│   │           ├── PostgresShipComplianceRepository.ts
│   │           ├── PostgresComplianceRepository.ts
│   │           ├── PostgresBankingRepository.ts
│   │           └── PostgresPoolRepository.ts
│   └── infrastructure/                # Infrastructure Setup
│       └── server.ts                  # Express Server Configuration
├── database/
│   └── schema.sql                     # Database Schema
├── run-schema.ts                      # Schema Execution Script
├── seed-demo-data.js                  # Demo Data Seeding Script
└── package.json
```

### Frontend Structure

```
frontend/
├── src/
│   ├── core/                          # Core Business Logic
│   │   ├── domain/models/             # Domain Models
│   │   │   ├── Route.ts
│   │   │   ├── ShipCompliance.ts
│   │   │   ├── Compliance.ts
│   │   │   └── Pool.ts
│   │   ├── application/usecases/      # Use Cases
│   │   │   ├── RouteUseCases.ts
│   │   │   ├── ShipComplianceUseCases.ts
│   │   │   ├── ComplianceUseCases.ts
│   │   │   └── PoolUseCases.ts
│   │   └── ports/repositories/        # Repository Interfaces
│   │       ├── IRouteRepository.ts
│   │       ├── IShipComplianceRepository.ts
│   │       ├── IComplianceRepository.ts
│   │       └── IPoolRepository.ts
│   ├── adapters/
│   │   ├── infrastructure/api/        # HTTP Clients
│   │   │   ├── HttpRouteRepository.ts
│   │   │   ├── HttpShipComplianceRepository.ts
│   │   │   ├── HttpComplianceRepository.ts
│   │   │   └── HttpPoolRepository.ts
│   │   └── ui/                        # React UI Components
│   │       ├── components/            # Reusable Components
│   │       │   ├── Layout.tsx         # Sidebar navigation layout
│   │       │   ├── DataTable.tsx      # Enhanced data table
│   │       │   ├── StatCard.tsx       # Statistics card component
│   │       │   ├── FilterBar.tsx      # Advanced filter component
│   │       │   └── ComplianceStatusBadge.tsx
│   │       └── pages/                 # Page Components
│   │           ├── RoutesPage.tsx
│   │           ├── ComparePage.tsx
│   │           ├── ShipCompliancePage.tsx
│   │           ├── BankingPage.tsx
│   │           └── PoolingPage.tsx
│   └── shared/                        # Shared Utilities
│       ├── hooks/                     # Custom React Hooks
│       ├── lib/                       # Utility Libraries
│       └── utils/                     # Helper Functions
├── public/
│   └── varuna-logo.svg                # Company Logo
└── index.css                          # Global styles with gradient theme
```

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript 5.3+
- **Database**: PostgreSQL 12+
- **ORM/Query**: Native `pg` library
- **Environment**: dotenv

### Frontend
- **Framework**: React 18.3+
- **Language**: TypeScript 5.8+
- **Build Tool**: Vite 5.4+
- **Styling**: TailwindCSS 3.4+
- **UI Components**: Radix UI + Shadcn UI
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM 6.30+
- **Charts**: Recharts 2.15+
- **Icons**: Lucide React

### Development Tools
- **Type Checking**: TypeScript Compiler
- **Code Execution**: tsx (TypeScript execution)
- **Package Manager**: npm

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0 or higher ([Download](https://nodejs.org/))
- **npm** 9.0 or higher (comes with Node.js)
- **PostgreSQL** 12.0 or higher ([Download](https://www.postgresql.org/download/))
- **Git** (for version control)

### Verify Installation

```bash
node --version    # Should be v18.0.0 or higher
npm --version     # Should be 9.0.0 or higher
psql --version    # Should be 12.0 or higher
```

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "FuelEU Maritime Project"
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fuel_eu_maritime
DB_USER=postgres
DB_PASSWORD=your_password

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Frontend Configuration

The frontend uses Vite's proxy configuration (in `vite.config.ts`) to forward API requests to the backend. No additional configuration is required for development.

---

## 🗄️ Database Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE fuel_eu_maritime;

# Exit PostgreSQL
\q
```

### 2. Run Database Schema

**Option A: Using npm script (Recommended)**

```bash
cd backend
npm run schema
```

**Option B: Using psql directly**

```bash
psql -U postgres -d fuel_eu_maritime -f backend/database/schema.sql
```

**Option C: Using PowerShell script (Windows)**

```powershell
cd backend
.\run-schema.ps1
```

### 3. Seed Demo Data (Optional)

To populate the database with sample data for testing:

```bash
cd backend
npm run seed
```

This will create:
- 100 routes across multiple years (2023-2025)
- 100 ships with compliance data
- 30 bank entries
- Sample pools

---

## 🏃 Running the Application

### Development Mode

#### Start Backend Server

```bash
cd backend
npm run dev
```

The backend server will start on `http://localhost:3001`

#### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000` (or the next available port)

### Production Build

#### Build Backend

```bash
cd backend
npm run build
npm start
```

#### Build Frontend

```bash
cd frontend
npm run build
npm run preview
```

---

## 📡 API Documentation

### Base URL

```
http://localhost:3001/api
```

### Routes API

#### Get All Routes
```http
GET /api/routes
```

**Response:**
```json
[
  {
    "routeId": "R001",
    "vesselType": "Container Ship",
    "fuelType": "MGO",
    "year": 2024,
    "ghgIntensity": 85.5,
    "fuelConsumption": 5000000,
    "distance": 1200,
    "totalEmissions": 427500000,
    "isBaseline": false
  }
]
```

#### Set Baseline Route
```http
POST /api/routes/:routeId/baseline
Content-Type: application/json

{
  "year": 2024,
  "ghgIntensity": 85.5,
  "fuelConsumption": 5000000,
  "distance": 1200,
  "totalEmissions": 427500000
}
```

#### Get Route Comparison
```http
GET /api/routes/comparison?routeId=R001&year=2024
```

**Response:**
```json
{
  "routeId": "R001",
  "year": 2024,
  "baseline": { ... },
  "current": { ... },
  "percentDifference": 5.2,
  "isCompliant": true
}
```

### Ship Compliance API

#### Get All Ship Compliance for Year
```http
GET /api/ship-compliance/year/:year
```

**Example:**
```http
GET /api/ship-compliance/year/2024
```

#### Get Specific Ship Compliance
```http
GET /api/ship-compliance/:shipId/:year
```

**Example:**
```http
GET /api/ship-compliance/R001/2024
```

#### Compute Ship Compliance Balance
```http
POST /api/ship-compliance/compute
Content-Type: application/json

{
  "shipId": "R001",
  "year": 2024,
  "routeId": "R001"
}
```

### Compliance API

#### Get Overall Compliance Balance
```http
GET /api/compliance/cb?year=2024
```

**Response:**
```json
{
  "year": 2024,
  "totalCB": 1500000,
  "isCompliant": true
}
```

#### Get Adjusted Compliance Balance Per Ship
```http
GET /api/compliance/adjusted-cb?year=2024
```

**Response:**
```json
[
  {
    "shipId": "R001",
    "year": 2024,
    "adjustedCB": 50000
  }
]
```

### Banking API

#### Bank Surplus
```http
POST /api/banking/bank
Content-Type: application/json

{
  "shipId": "R001",
  "year": 2024,
  "amount": 10000
}
```

#### Apply Banked Surplus
```http
POST /api/banking/apply
Content-Type: application/json

{
  "shipId": "R001",
  "year": 2024,
  "amount": 5000
}
```

#### Get Banked Amount
```http
GET /api/banking/banked/:shipId/:year
```

**Example:**
```http
GET /api/banking/banked/R001/2024
```

### Pooling API

#### Create Pool
```http
POST /api/pools
Content-Type: application/json

{
  "name": "Strategic Pool 2024",
  "year": 2024,
  "memberShipIds": ["R001", "R002", "R003"]
}
```

**Response:**
```json
{
  "id": "pool-123",
  "name": "Strategic Pool 2024",
  "year": 2024,
  "members": [
    {
      "shipId": "R001",
      "cbBeforePool": -50000,
      "cbAfterPool": 0
    }
  ],
  "poolSum": 0,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### Get All Pools
```http
GET /api/pools
```

#### Get Pool by ID
```http
GET /api/pools/:id
```

---

## 🎨 Frontend Features

### Modern UI Design
- **Sidebar Navigation**: Collapsible dark sidebar with smooth transitions and active state indicators
- **Gradient Theme**: Modern blue-purple gradient color scheme throughout the application
- **Responsive Layout**: Optimized for all screen sizes with adaptive layouts
- **Interactive Components**: Enhanced buttons, cards, and badges with hover effects and transitions
- **Statistics Dashboard**: Real-time KPI cards with visual indicators and progress bars
- **Improved UX**: Better spacing, typography, and visual hierarchy for enhanced user experience

### Routes Page
- **Statistics Cards**: Overview cards showing total routes, compliance rates, average intensity, and non-compliant routes
- **Advanced Filtering**: Collapsible filter panel with active filter badges and individual clear options
- **Sidebar Actions**: Quick actions panel and compliance summary in right sidebar
- **Baseline Banner**: Prominent baseline route indicator with gradient background and visual highlighting
- **Enhanced Data Table**: Improved table styling with icons, status badges, and action buttons
- **Filter Management**: Individual filter clearing and bulk reset functionality

### Compare Page
- **Comparison View**: Side-by-side baseline vs current comparison with visual indicators
- **Visual Charts**: Interactive bar charts for GHG intensity visualization
- **Compliance Status**: Color-coded compliance badges with icons for quick recognition
- **Percent Differences**: Calculate and display changes with trend indicators (up/down arrows)
- **KPI Dashboard**: Key performance indicators displayed prominently

### Ship CB Page
- **Search Functionality**: Search for specific ships with instant filtering
- **Year Filtering**: View compliance data by year with easy year selection
- **Compute CB**: Calculate compliance balance for ships with detailed results
- **Data Visualization**: Display CB values with proper formatting and color coding
- **Compliance Status**: Visual status indicators (surplus/deficit) for each ship

### Banking Page
- **Current CB Display**: Show current compliance balance with visual cards
- **Bank Operations**: Bank surplus for future use with validation
- **Apply Operations**: Apply banked surplus to deficits with real-time updates
- **Transaction History**: View banking operations with detailed information
- **Visual Cards**: Enhanced card design with gradient accents and icons

### Pooling Page
- **Ship Selection**: Select ships for pool creation with visual indicators
- **Pool Types**: Strategic pooling and fleet compliance management options
- **Article 21 Validation**: Real-time validation of pool rules with clear error messages
- **Before/After Display**: Visual representation of CB changes with comparison views
- **Pool History**: View all created pools with detailed member information
- **Warning System**: Visual warnings for rule violations with helpful guidance

---

## 💻 Development

### Type Checking

**Backend:**
```bash
cd backend
npm run type-check
```

**Frontend:**
```bash
cd frontend
npm run type-check
```

### Code Structure Guidelines

1. **Domain Models**: Define business entities in `core/domain/`
2. **Use Cases**: Implement business logic in `core/application/`
3. **Repositories**: Define interfaces in `core/ports/`
4. **Adapters**: Implement infrastructure in `adapters/`
5. **UI Components**: Create reusable components in `adapters/ui/components/`

### Adding New Features

1. **Define Domain Model** → `core/domain/`
2. **Create Repository Interface** → `core/ports/`
3. **Implement Use Case** → `core/application/`
4. **Create Database Repository** → `adapters/outbound/postgres/`
5. **Add API Route** → `adapters/inbound/http/routes/`
6. **Create Frontend Repository** → `adapters/infrastructure/api/`
7. **Implement Frontend Use Case** → `core/application/usecases/`
8. **Build UI Component** → `adapters/ui/pages/`

---

## 📊 Database Schema

### Tables

#### `routes`
Stores vessel route information and emissions data.

```sql
CREATE TABLE routes (
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
```

#### `ship_compliance`
Stores computed compliance balance (CB) per ship.

```sql
CREATE TABLE ship_compliance (
  id SERIAL PRIMARY KEY,
  ship_id VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  cb_gco2eq DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ship_id, year)
);
```

#### `adjusted_compliance_balances`
Stores adjusted CB after banking operations (used for pooling).

```sql
CREATE TABLE adjusted_compliance_balances (
  ship_id VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  adjusted_cb DECIMAL(15, 2) NOT NULL,
  PRIMARY KEY (ship_id, year)
);
```

#### `bank_entries`
Stores banking operations (bank and apply).

```sql
CREATE TABLE bank_entries (
  id SERIAL PRIMARY KEY,
  ship_id VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  operation_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `pools`
Stores pool information.

```sql
CREATE TABLE pools (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200),
  year INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `pool_members`
Stores pool membership and CB changes.

```sql
CREATE TABLE pool_members (
  id SERIAL PRIMARY KEY,
  pool_id INTEGER NOT NULL REFERENCES pools(id),
  ship_id VARCHAR(50) NOT NULL,
  cb_before DECIMAL(15, 2) NOT NULL,
  cb_after DECIMAL(15, 2) NOT NULL,
  FOREIGN KEY (pool_id) REFERENCES pools(id) ON DELETE CASCADE
);
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

---

## 📝 License

This project is licensed under the ISC License.

---

## 📚 Documentation

This project includes comprehensive documentation:

- **README.md**: Complete project documentation with setup instructions
- **REFLECTION.md**: Reflection on AI-assisted development process
- **AGENT_WORKFLOW.md**: Detailed AI agent usage and workflow documentation

---

## 📞 Support

For support, please open an issue in the repository.

---

## 🙏 Acknowledgments

- **Varuna Marine Services** - Smart Sustainable Shipping
- Fuel EU Maritime Regulation compliance requirements
- European Union regulatory framework

---

<div align="center">

**Built with modern technologies and best practices**

*Smart Sustainable Shipping*

</div>
