import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IMF Article Search",
  description: "Multilingual semantic search over IMF articles using Azure AI Search",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
