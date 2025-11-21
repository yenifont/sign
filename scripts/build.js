const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure DATABASE_URL is set
const envPath = path.join(process.cwd(), '.env');
const envLocalPath = path.join(process.cwd(), '.env.local');

// Check if .env or .env.local exists
if (!fs.existsSync(envPath) && !fs.existsSync(envLocalPath)) {
  console.log('⚠️  No .env file found. Creating .env.local with default DATABASE_URL...');
  const defaultEnv = 'DATABASE_URL="file:./prisma/dev.db"\n';
  fs.writeFileSync(envLocalPath, defaultEnv);
  console.log('✅ Created .env.local');
}

// Set DATABASE_URL if not already set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./prisma/dev.db';
}

console.log('📦 Generating Prisma Client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma Client generated');
} catch (error) {
  console.error('❌ Failed to generate Prisma Client');
  process.exit(1);
}

console.log('🏗️  Building Next.js app...');
try {
  execSync('next build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
}

