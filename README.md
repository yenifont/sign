# Passkey Login with WebAuthn

Modern, secure passwordless authentication using WebAuthn/Passkeys.

## Features

- 🔐 Passwordless authentication with WebAuthn
- 📱 Biometric authentication support (TouchID, FaceID, Windows Hello)
- 🎨 Modern, beautiful UI with animations
- 🌙 Dark mode support
- ⚡ Fast and secure

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd login-main
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables

Create a `.env` file in the root directory with your PostgreSQL connection string:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/database_name"
```

Or create `.env.local` (recommended for Next.js):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/database_name"
```

**For local development, you can use:**
- [Neon](https://neon.tech/) - Serverless PostgreSQL
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [Railway](https://railway.app/) - PostgreSQL hosting
- Local PostgreSQL installation

4. Initialize the database and run migrations
```bash
npm run db:setup
```

This will create the initial migration and apply it to your database.

5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build

### Local Build
```bash
npm run build
```

### Vercel Deployment

**Important:** For Vercel deployment, you need to:

1. **Set Environment Variables in Vercel Dashboard:**
   - Go to your project settings → Environment Variables
   - Add `DATABASE_URL` with your production database URL
   - For production, use a cloud database (PostgreSQL, MySQL, etc.)
   - SQLite won't work on Vercel (file system is read-only)

2. **Recommended Production Databases:**
   - [Neon](https://neon.tech/) - Serverless PostgreSQL (Recommended)
   - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
   - [Supabase](https://supabase.com/)
   - [Railway](https://railway.app/)

3. **Prisma Schema:**
   The schema is already configured for PostgreSQL:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

4. **Migrations:**
   Migrations will run automatically during Vercel build via `prisma migrate deploy`.

5. **Deploy:**
   ```bash
   vercel --prod
   ```

## Scripts

- `npm run dev` - Start development server (runs migrations automatically)
- `npm run build` - Build for production (with auto .env setup)
- `npm run build:simple` - Simple build (requires .env)
- `npm run db:setup` - Initialize database and create initial migration
- `npm run db:migrate` - Create and apply a new migration (development)
- `npm run db:migrate:deploy` - Apply pending migrations (production)
- `npm run db:reset` - Reset database (drops all data)
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Database connection string | Yes |

### Local Development
```env
DATABASE_URL="postgresql://user:password@localhost:5432/database_name"
```

### Production (Vercel/Neon)
```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

**Example Neon connection string:**
```
postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

## Troubleshooting

### DATABASE_URL not found error

1. Make sure `.env` or `.env.local` file exists in the root directory
2. Check that `DATABASE_URL` is set correctly
3. Run `npm run db:setup` to initialize the database

### Build fails on Vercel

1. Make sure `DATABASE_URL` is set in Vercel environment variables
2. Use a cloud database (not SQLite) for production
3. Check Vercel build logs for detailed error messages

## Tech Stack

- **Next.js 16** - React framework
- **Prisma** - Database ORM
- **SimpleWebAuthn** - WebAuthn library
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## License

MIT
