import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_TTL_SECONDS = 8 * 60 * 60;

@Injectable()
export class AuthService {
  private readonly secret = process.env.AUTH_SECRET ?? 'eventhub-development-secret';

  login(email: string, password: string): { accessToken: string; user: { email: string; name: string } } {
    if (email !== 'admin@eventhub.com' || password !== 'admin123') {
      throw new UnauthorizedException('Identifiants incorrects.');
    }

    const payload = Buffer.from(
      JSON.stringify({ sub: email, role: 'admin', exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS }),
    ).toString('base64url');
    const signature = this.sign(payload);

    return {
      accessToken: `${payload}.${signature}`,
      user: { email, name: 'Administrateur' },
    };
  }

  verify(token: string): boolean {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return false;

    const expected = this.sign(payload);
    if (signature.length !== expected.length) return false;

    try {
      if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
      const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { role?: string; exp?: number };
      return claims.role === 'admin' && typeof claims.exp === 'number' && claims.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  private sign(payload: string): string {
    return createHmac('sha256', this.secret).update(payload).digest('base64url');
  }
}
