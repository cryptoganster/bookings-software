export interface Button {
  id: string;
  title: string;
}

export interface ListItem {
  id: string;
  title: string;
  description?: string;
}

export interface ListSection {
  title?: string;
  rows: ListItem[];
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
  sendInteractiveList(
    to: string,
    bodyText: string,
    buttonText: string,
    sections: ListSection[],
  ): Promise<void>;
  sendLocation(to: string, location: Location): Promise<void>;
}
