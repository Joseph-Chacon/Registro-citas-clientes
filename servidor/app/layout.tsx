import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agenda | Ubicación de tu cita",
  description: "Comparte la ubicación de cada cita y abre indicaciones en Maps.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
