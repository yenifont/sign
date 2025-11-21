import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

export async function POST() {
    try {
        const dbPath = join(process.cwd(), 'prisma', 'dev.db');
        
        // Check if database already exists
        if (existsSync(dbPath)) {
            return NextResponse.json({ 
                message: 'Database already exists',
                exists: true 
            });
        }

        // Try to initialize database
        try {
            execSync('npx prisma db push --accept-data-loss', {
                stdio: 'pipe',
                cwd: process.cwd(),
            });
            
            return NextResponse.json({ 
                message: 'Database initialized successfully',
                success: true 
            });
        } catch (error: any) {
            return NextResponse.json({ 
                error: 'Failed to initialize database',
                message: error.message || 'Please run: npm run db:setup',
                success: false 
            }, { status: 500 });
        }
    } catch (error: any) {
        return NextResponse.json({ 
            error: 'Database initialization error',
            message: error.message,
            success: false 
        }, { status: 500 });
    }
}

