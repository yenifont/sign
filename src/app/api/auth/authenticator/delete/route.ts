import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function DELETE(request: Request) {
    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get('session')?.value;

        if (!sessionId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { credentialID } = body;

        if (!credentialID) {
            return NextResponse.json({ error: 'Credential ID is required' }, { status: 400 });
        }

        // Verify the authenticator belongs to the current user
        const authenticator = await prisma.authenticator.findUnique({
            where: { credentialID },
            include: { user: true },
        });

        if (!authenticator) {
            return NextResponse.json({ error: 'Authenticator not found' }, { status: 404 });
        }

        if (authenticator.userId !== sessionId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Delete the authenticator
        await prisma.authenticator.delete({
            where: { credentialID },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete authenticator error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete authenticator' },
            { status: 500 }
        );
    }
}

