import { SitecoreItem } from "../base-item.model";
import { DateField, TextField } from "../fields.model";

export interface ArticleResult extends SitecoreItem {
  abstract?: TextField;
  publicationTitle?: TextField;
  publicationShortDescription?: TextField;
  publicationDate?: DateField;
  subtitle_348d48e267c343cf940d63c46c3ccf87?: TextField;
  title?: TextField;
}
