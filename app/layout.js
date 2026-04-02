import "./globals.css";

export const metadata = {
  title: "Vaani — Business Dashboard",
  description: "WhatsApp AI business dashboard — orders, invoices, inventory & payments",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
