import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}


export function getRPID(request: Request): string {
    const host = request.headers.get('host');
    if (!host) return 'localhost';
    // Remove port if present
    return host.split(':')[0];
}

export function getOrigin(request: Request): string {
    const origin = request.headers.get('origin');
    if (origin) return origin;
    
    const host = request.headers.get('host');
    if (host) {
        // Assume https for production, http for localhost
        const protocol = host.includes('localhost') ? 'http' : 'https';
        return `${protocol}://${host}`;
    }
    
    return 'http://localhost:3000'; // Fallback
}
