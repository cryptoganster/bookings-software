import {
  IWhatsAppClient,
  Button,
  ListSection,
  Location,
} from '@conversation/domain/interfaces/external/whatsapp-client';

/**
 * Mock WhatsApp Client for Unit Testing
 *
 * Propósito:
 * - Simular el comportamiento de IWhatsAppClient sin hacer llamadas reales a la API
 * - Proporcionar respuestas predecibles para testing
 * - Permitir verificación de llamadas y argumentos
 * - Simular errores y casos edge
 *
 * Uso:
 * ```typescript
 * const mockClient = new MockWhatsAppClient();
 * mockClient.sendMessage('1234567890', 'Hello');
 * expect(mockClient.sentMessages).toHaveLength(1);
 * expect(mockClient.sentMessages[0]).toEqual({
 *   to: '1234567890',
 *   message: 'Hello',
 * });
 * ```
 */
export class MockWhatsAppClient implements IWhatsAppClient {
  // Tracking de mensajes enviados
  public sentMessages: Array<{ to: string; message: string }> = [];
  public sentInteractiveButtons: Array<{ to: string; message: string; buttons: Button[] }> = [];
  public sentInteractiveLists: Array<{
    to: string;
    bodyText: string;
    buttonText: string;
    sections: ListSection[];
  }> = [];
  public sentLocations: Array<{ to: string; location: Location }> = [];

  // Configuración de comportamiento
  private shouldFail = false;
  private failureMessage = 'Mock WhatsApp API error';
  private delayMs = 0;

  /**
   * Envía un mensaje de texto
   */
  async sendMessage(to: string, message: string): Promise<void> {
    await this.simulateDelay();

    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }

    this.sentMessages.push({ to, message });
  }

  /**
   * Envía botones interactivos
   */
  async sendInteractiveButtons(to: string, message: string, buttons: Button[]): Promise<void> {
    await this.simulateDelay();

    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }

    this.sentInteractiveButtons.push({ to, message, buttons });
  }

  /**
   * Envía lista interactiva
   */
  async sendInteractiveList(
    to: string,
    bodyText: string,
    buttonText: string,
    sections: ListSection[],
  ): Promise<void> {
    await this.simulateDelay();

    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }

    this.sentInteractiveLists.push({ to, bodyText, buttonText, sections });
  }

  /**
   * Envía ubicación
   */
  async sendLocation(to: string, location: Location): Promise<void> {
    await this.simulateDelay();

    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }

    this.sentLocations.push({ to, location });
  }

  // ========== Métodos de Utilidad para Testing ==========

  /**
   * Configura el mock para que falle en la próxima llamada
   */
  setShouldFail(shouldFail: boolean, message?: string): void {
    this.shouldFail = shouldFail;
    if (message) {
      this.failureMessage = message;
    }
  }

  /**
   * Configura un delay artificial para simular latencia de red
   */
  setDelay(delayMs: number): void {
    this.delayMs = delayMs;
  }

  /**
   * Limpia todos los mensajes enviados
   */
  reset(): void {
    this.sentMessages = [];
    this.sentInteractiveButtons = [];
    this.sentInteractiveLists = [];
    this.sentLocations = [];
    this.shouldFail = false;
    this.failureMessage = 'Mock WhatsApp API error';
    this.delayMs = 0;
  }

  /**
   * Obtiene el total de mensajes enviados (todos los tipos)
   */
  getTotalMessagesSent(): number {
    return (
      this.sentMessages.length +
      this.sentInteractiveButtons.length +
      this.sentInteractiveLists.length +
      this.sentLocations.length
    );
  }

  /**
   * Verifica si se envió un mensaje específico
   */
  hasMessageBeenSent(to: string, message: string): boolean {
    return this.sentMessages.some((msg) => msg.to === to && msg.message === message);
  }

  /**
   * Verifica si se enviaron botones interactivos a un destinatario
   */
  hasInteractiveButtonsBeenSent(to: string): boolean {
    return this.sentInteractiveButtons.some((msg) => msg.to === to);
  }

  /**
   * Verifica si se envió una lista interactiva a un destinatario
   */
  hasInteractiveListBeenSent(to: string): boolean {
    return this.sentInteractiveLists.some((msg) => msg.to === to);
  }

  /**
   * Verifica si se envió una ubicación a un destinatario
   */
  hasLocationBeenSent(to: string): boolean {
    return this.sentLocations.some((msg) => msg.to === to);
  }

  /**
   * Obtiene el último mensaje enviado a un destinatario
   */
  getLastMessageTo(to: string): string | undefined {
    const messages = this.sentMessages.filter((msg) => msg.to === to);
    return messages.length > 0 ? messages[messages.length - 1].message : undefined;
  }

  /**
   * Obtiene todos los mensajes enviados a un destinatario
   */
  getMessagesTo(to: string): string[] {
    return this.sentMessages.filter((msg) => msg.to === to).map((msg) => msg.message);
  }

  /**
   * Simula delay de red
   */
  private async simulateDelay(): Promise<void> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }
  }
}
