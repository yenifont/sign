import { existsSync } from 'fs';
import { join } from 'path';

let initialized = false;

export async function ensureDatabaseInitialized() {
    if (initialized) return;

    try {
        const dbPath = join(process.cwd(), 'prisma', 'dev.db');
        
        // Check if database file exists
        if (!existsSync(dbPath)) {
            console.warn('⚠️  Database file not found at:', dbPath);
            console.warn('📝 Please run: npm run db:setup');
            console.warn('   Or manually: npx prisma db push');
        } else {
            console.log('✅ Database file found');
        }
        
        initialized = true;
    } catch (error) {
        console.error('Database initialization check error:', error);
    }
}

