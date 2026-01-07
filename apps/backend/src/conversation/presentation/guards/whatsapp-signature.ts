import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class WhatsAppSignatureGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Obtener el token de verificación de webhook
    const verifyToken = this.configService.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN');

    // Verificación de webhook (GET request)
    if (request.method === 'GET') {
      const mode = request.query['hub.mode'];
      const token = request.query['hub.verify_token'];
      const challenge = request.query['hub.challenge'];

      if (mode === 'subscribe' && token === verifyToken) {
        // Responder con el challenge para verificar el webhook
        request.webhookChallenge = challenge;
        return true;
      }

      throw new UnauthorizedException('Invalid webhook verification token');
    }

    // Validación de firma para mensajes entrantes (POST request)
    const signature = request.headers['x-hub-signature-256'];

    if (!signature) {
      throw new UnauthorizedException('Missing signature header');
    }

    const appSecret = this.configService.get<string>('WHATSAPP_WEBHOOK_SECRET');

    if (!appSecret) {
      throw new UnauthorizedException('Webhook secret not configured');
    }

    // Calcular la firma esperada
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(JSON.stringify(request.body))
      .digest('hex');

    const signatureHash = signature.split('sha256=')[1];

    // Comparación segura de firmas
    if (!crypto.timingSafeEqual(Buffer.from(signatureHash), Buffer.from(expectedSignature))) {
      throw new UnauthorizedException('Invalid signature');
    }

    return true;
  }
}
