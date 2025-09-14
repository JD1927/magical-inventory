# Magical Inventory AI Agent Instructions

## Project Overview

This is a NestJS-based inventory management system with modules for products, categories, suppliers, and inventory movements. The system supports profit tracking, inventory control, and reporting.

## Key Architecture Patterns

### Module Structure

- **Products**: Core product management (`/src/products`)
  - Products can have main and secondary categories
  - Product prices include purchase and sale prices
  - Uses query builders for complex operations

- **Categories**: Product categorization (`/src/categories`)
  - Supports main/secondary category relationships
  - Validates category hierarchies

- **Inventory**: Stock and movement tracking (`/src/inventory`)
  - Separates IN/OUT movements
  - Handles stock calculations with transaction safety
  - Calculates profits using Decimal.js for precision
  - Implements profit reporting with date-based filtering

- **Suppliers**: Vendor management (`/src/suppliers`)
  - Links to inventory movements for purchase tracking

### Common Patterns

1. **Database Operations**
   - Use TypeORM query builders for complex queries
   - Wrap operations in transactions when updating multiple records
   - Use the `handleDatabaseExceptions` pattern for error handling

2. **DTOs and Validation**
   - Input validation using class-validator
   - Strict type checking with `forbidNonWhitelisted: true`
   - Transform options disable implicit conversions

3. **Service Methods**
   - Follow CRUD pattern with additional business logic
   - Use private helper methods for reusable logic
   - Implement proper error handling and logging

## Critical Workflows

### Development Setup

```bash
pnpm install
docker compose up -d  # Starts PostgreSQL 17.6
pnpm run start:dev   # Runs in watch mode
```

### Database Handling

- Uses TypeORM with PostgreSQL
- Auto-synchronizes schema in development
- Handles timezone using America/Bogota
- Requires SSL in production

### Price Calculations

- Uses Decimal.js for financial calculations
- Supports profit margins and discounts
- Calculates sale prices based on purchase price and margin

## Integration Points

1. **Database**: PostgreSQL 17.6 with TypeORM
2. **Environment**: Uses .env with validation schema
3. **Date Handling**: dayjs with timezone support
4. **Financial Math**: Decimal.js for precision

## Project-Specific Conventions

1. **Error Handling**
   - Services use private `handleDatabaseExceptions`
   - Controllers use `ParseUUIDPipe` for IDs
   - Custom exceptions with descriptive messages

2. **Query Building**
   - Use TypeORM query builders over find operations
   - Include explicit column selection
   - Group complex queries in service methods

3. **Transaction Management**
   - Use query runners for multi-step operations
   - Always handle rollback in catch blocks
   - Release query runners in finally blocks

## Common Gotchas

1. Always use Decimal.js for financial calculations
2. Handle timezones using configured dayjs
3. Validate category relationships before updates
4. Use transactions for inventory movements
5. Check stock levels before OUT movements
