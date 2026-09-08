# soukcart (nekcart)

Ground-up B2B marketplace from UI Twin specs + project plan. Not a clone of the old SoukCart repo.

## Stack
- client: React + Vite + Tailwind + React Context
- server: Express + Mongoose
- DB: local Docker MongoDB (`nekcart-mongo` on `27017`)

## Quick start
```bash
# Mongo (if not already running)
docker compose up -d

# Server
cd server
cp ../.env.example .env
bun install
bun run seed
bun run dev

# Client (new terminal)
cd client
bun install
bun run dev
```

Open http://localhost:5173

### Seed accounts
| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@soukcart.com | Password123! |
| Supplier | supplier@soukcart.com | Password123! |
| Retailer | retailer@soukcart.com | Password123! |
