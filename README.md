# Asset Management MVP

A minimal personal stock portfolio manager built with Next.js, Prisma, and SQLite.

## Tech Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Prisma
- SQLite

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create your environment file:
   ```bash
   cp .env.example .env
   ```

3. Generate the Prisma client and apply the database schema:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to view the dashboard.

## API Endpoints

- `GET /api/holdings` - List holdings
- `POST /api/holdings` - Create holding
- `GET /api/holdings/[id]` - Fetch a holding
- `PUT /api/holdings/[id]` - Update a holding
- `DELETE /api/holdings/[id]` - Delete a holding

### Sample Payload
```json
{
  "ticker": "AAPL",
  "name": "Apple Inc.",
  "shares": 10,
  "buy_price": 150,
  "current_price": 180,
  "sector": "Technology",
  "country": "USA",
  "themes": "Consumer electronics",
  "notes": "Long-term hold"
}
```
