export interface Chapter {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  shortDescription: string;
  fullStory: string;
  imageUrl: string;
  romanticQuote: string;
}

export interface PortalConfig {
  bookTitle: string;
  authorName: string;
  welcomeTitle: string;
  welcomeMessage: string;
  romanticDedicatory: string;
  backgroundMusicUrl?: string;
}
