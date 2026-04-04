import "./globals.css";
import { ThemeProvider } from "@/lib/theme";

export const metadata = {
  title: "BusinessVaani — Smart Business Management",
  description: "Automate your retail storefront with AI-powered invoicing, inventory, and WhatsApp integration.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vaani Manager",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#E07A5F" />
      </head>
      <body className="h-full antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
