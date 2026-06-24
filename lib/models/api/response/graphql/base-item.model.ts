export interface SitecoreItem {
  id: string;
  name: string;
  language: Language;
  template: Template;
  url: Url;
}

export interface Template {
  id: string;
}

export interface Url {
  url?: string;
}

export interface Language {
  name: string;
}
