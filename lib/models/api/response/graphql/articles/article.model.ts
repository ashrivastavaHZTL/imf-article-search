export interface ArticleResult {
  id: string;
  name: string;
  template: { name: string };
  publicationDate?: { dateValue: string; formattedDateValue: string };
  title?: { value: string };
  abstract?: { value: string };
}
