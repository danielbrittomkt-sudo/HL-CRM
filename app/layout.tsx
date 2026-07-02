import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Home Life CRM",
  description: "CRM interno preditivo da Home Life Negócios Imobiliários."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
