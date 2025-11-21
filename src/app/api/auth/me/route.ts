import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get('session')?.value;

        if (!sessionId) {
            return NextResponse.json({ user: null }, { status: 200 });
        }

        const user = await prisma.user.findUnique({
            where: { id: sessionId },
            select: {
                id: true,
                email: true,
                password: true,
                createdAt: true,
                authenticators: {
                    select: {
                        credentialID: true,
                        credentialDeviceType: true,
                    },
                },
            },
        });

        if (!user) {
            cookieStore.delete('session');
            return NextResponse.json({ user: null }, { status: 200 });
        }

        return NextResponse.json({ 
            user: {
                id: user.id,
                email: user.email,
                hasPassword: !!user.password,
                hasPasskey: user.authenticators.length > 0,
                authenticators: user.authenticators.map(a => ({
                    id: a.credentialID,
                    deviceType: a.credentialDeviceType,
                    createdAt: a.credentialID, // You might want to add createdAt to schema
                })),
            }
        });
    } catch (error: any) {
        console.error('Get user error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get user' },
            { status: 500 }
        );
    }
}

