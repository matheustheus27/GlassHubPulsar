import {FontStyleDTO} from "./FontStyleDTO";

export interface CoverSettings {
  language: string;
  theme: "light" | "dark";
  card: {
    borderColor: string;
    backgroundColor: string;
  };
  title: {
    primary:FontStyleDTO;
    secondary: FontStyleDTO;
  };
  subtitle: {
    primary:FontStyleDTO;
    secondary: FontStyleDTO;
  };
  meta: FontStyleDTO;
  cover: {
    common: FontStyleDTO;
    signature: FontStyleDTO;
  };
  backgroundColor?: string;
}

export interface ContactItem {
  title: string;
  link: string;
  icon: string;
}

export interface PersonalItem {
  name: string;
  title: string;
  location: ContactItem;
  contact: Array<ContactItem>;
}

export interface CoverDTO {
  settings: CoverSettings;
  personal: {
    title: string;
    personal: PersonalItem;
  };
  greeting: string;
  bullets: Array<string>;
  signature: string;
  valediction: string;
}