export interface Button {
  id: string;
  title: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
}

export interface IWhatsAppClient {
  sendMessage(to: string, message: string): Promise<void>;
  sendInteractiveButtons(to: string, message: string, buttons: Button[]): Promise<void>;
  sendLocation(to: string, location: Location): Promise<void>;
}
