# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Clean architecture structure reorganization
- Backend: Separated inbound (HTTP routes) and outbound (PostgreSQL) adapters
- Frontend: Organized UI components, pages, hooks, and utilities
- Comprehensive formatting utilities for numbers, emissions, distances
- Error handling for non-numeric values in formatting functions

### Changed
- Moved backend routes from `adapters/http/` to `adapters/inbound/http/routes/`
- Moved backend repositories from `adapters/persistence/` to `adapters/outbound/postgres/`
- Moved backend server setup to `infrastructure/server.ts`
- Reorganized frontend: pages, components, hooks, and lib into proper structure
- Updated all import paths to reflect new structure

### Fixed
- Fixed import path errors after reorganization
- Fixed Vite alias configuration for component imports
- Fixed formatting functions to handle null/undefined/string values gracefully
- Fixed TypeScript compilation errors

## [1.0.0] - Initial Release

### Added
- Route management functionality
- Compliance balance tracking
- Banking operations (bank and apply surplus)
- Pool creation and management
- Route comparison with baseline
- PostgreSQL database integration support
- Mock repositories for development
- React frontend with TailwindCSS
- TypeScript throughout the codebase

