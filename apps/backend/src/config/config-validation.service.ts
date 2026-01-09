import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Service to validate required environment variables on application startup.
 *
 * Validates:
 * - Database configuration
 * - JWT configuration
 * - WhatsApp configuration (based on selected provider)
 *
 * Throws clear error messages if required variables are missing.
 */
@Injectable()
export class ConfigValidationService implements OnModuleInit {
  private readonly logger = new Logger(ConfigValidationService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    this.logger.log('🔍 Validating environment configuration...');

    const errors: string[] = [];

    // Validate database configuration
    this.validateDatabase(errors);

    // Validate JWT configuration
    this.validateJWT(errors);

    // Validate WhatsApp configuration
    this.validateWhatsApp(errors);

    // Validate business configuration
    this.validateBusiness(errors);

    if (errors.length > 0) {
      this.logger.error('❌ Configuration validation failed:');
      errors.forEach((error) => this.logger.error(`   - ${error}`));
      throw new Error(
        `Configuration validation failed. Missing or invalid environment variables:\n${errors.join('\n')}`,
      );
    }

    this.logger.log('✅ Configuration validation passed');
    this.logConfigurationStatus();
  }

  private validateDatabase(errors: string[]): void {
    const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'];

    requiredVars.forEach((varName) => {
      const value = this.configService.get<string>(varName);
      if (!value) {
        errors.push(`${varName} is required for database connection`);
      }
    });
  }

  private validateJWT(errors: string[]): void {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const jwtExpiration = this.configService.get<string>('JWT_EXPIRATION');

    if (!jwtSecret) {
      errors.push('JWT_SECRET is required for authentication');
    } else if (jwtSecret === 'dev-secret-key-change-in-production') {
      this.logger.warn(
        '⚠️  Using default JWT_SECRET. Generate a secure secret for production: openssl rand -base64 32',
      );
    }

    if (!jwtExpiration) {
      errors.push('JWT_EXPIRATION is required (e.g., "1d", "7d")');
    }
  }

  private validateWhatsApp(errors: string[]): void {
    const provider = this.configService.get<string>('WHATSAPP_PROVIDER', 'meta');

    if (provider === 'meta') {
      this.validateMetaWhatsApp(errors);
    } else if (provider === 'twilio') {
      this.validateTwilioWhatsApp(errors);
    } else {
      errors.push(`Invalid WHATSAPP_PROVIDER: "${provider}". Must be "meta" or "twilio"`);
    }
  }

  private validateMetaWhatsApp(errors: string[]): void {
    const requiredVars = [
      'WHATSAPP_API_URL',
      'WHATSAPP_ACCESS_TOKEN',
      'WHATSAPP_PHONE_NUMBER_ID',
      'WHATSAPP_BUSINESS_ACCOUNT_ID',
      'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
      'WHATSAPP_WEBHOOK_SECRET',
    ];

    requiredVars.forEach((varName) => {
      const value = this.configService.get<string>(varName);
      if (!value) {
        errors.push(
          `${varName} is required for Meta WhatsApp Business API (WHATSAPP_PROVIDER=meta)`,
        );
      }
    });

    // Validate API URL format
    const apiUrl = this.configService.get<string>('WHATSAPP_API_URL');
    if (apiUrl && !apiUrl.startsWith('https://graph.facebook.com/')) {
      errors.push('WHATSAPP_API_URL must start with "https://graph.facebook.com/"');
    }

    // Warn about placeholder values
    const accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');
    if (accessToken === 'your-access-token-here') {
      errors.push(
        'WHATSAPP_ACCESS_TOKEN contains placeholder value. Get real token from Meta Dashboard.',
      );
    }

    const verifyToken = this.configService.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN');
    if (verifyToken === 'your-secure-random-verify-token-here') {
      errors.push(
        'WHATSAPP_WEBHOOK_VERIFY_TOKEN contains placeholder value. Generate with: openssl rand -hex 32',
      );
    }
  }

  private validateTwilioWhatsApp(errors: string[]): void {
    const requiredVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_FROM'];

    requiredVars.forEach((varName) => {
      const value = this.configService.get<string>(varName);
      if (!value) {
        errors.push(
          `${varName} is required for Twilio WhatsApp Sandbox (WHATSAPP_PROVIDER=twilio)`,
        );
      }
    });

    // Validate Twilio Account SID format
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    if (accountSid && !accountSid.startsWith('AC')) {
      this.logger.warn('⚠️  TWILIO_ACCOUNT_SID should start with "AC". Verify your credentials.');
    }
  }

  private validateBusiness(errors: string[]): void {
    const businessId = this.configService.get<string>('DEFAULT_BUSINESS_ID');

    if (!businessId) {
      errors.push('DEFAULT_BUSINESS_ID is required for webhook processing (single-tenant MVP)');
    } else if (businessId === 'your-business-uuid-here') {
      errors.push('DEFAULT_BUSINESS_ID contains placeholder value. Set to a valid business UUID.');
    }
  }

  private logConfigurationStatus(): void {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const port = this.configService.get<string>('PORT', '3000');
    const provider = this.configService.get<string>('WHATSAPP_PROVIDER', 'meta');
    const logLevel = this.configService.get<string>('LOG_LEVEL', 'info');

    this.logger.log('📋 Configuration Status:');
    this.logger.log(`   Environment: ${nodeEnv}`);
    this.logger.log(`   Port: ${port}`);
    this.logger.log(`   WhatsApp Provider: ${provider}`);
    this.logger.log(`   Log Level: ${logLevel}`);

    if (provider === 'meta') {
      const phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');
      this.logger.log(`   WhatsApp Phone Number ID: ${phoneNumberId}`);
    } else if (provider === 'twilio') {
      const twilioFrom = this.configService.get<string>('TWILIO_WHATSAPP_FROM');
      this.logger.log(`   Twilio WhatsApp From: ${twilioFrom}`);
    }
  }
}
