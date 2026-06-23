export interface SitecoreItem extends Url {
  id: string;
  name: string;
  template: Template;
}

export interface Template {
  id: string;
}

export interface Url {
  url?: string;
}
