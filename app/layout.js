import "./globals.css";

export const metadata = {
  title: "BusinessVaani — Smart Business Management",
  description: "Automate your retail storefront with AI-powered invoicing, inventory, and WhatsApp integration.",

};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
