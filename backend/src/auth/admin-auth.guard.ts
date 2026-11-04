import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string } }>();
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token || !this.authService.verify(token)) {
      throw new UnauthorizedException('Authentification requise.');
    }
    return true;
  }
}
